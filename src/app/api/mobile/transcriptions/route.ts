import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireMobileAuth } from '@/lib/mobile-auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
    try {
        const user = await requireMobileAuth(request)

        const formData = await request.formData()
        const materialId = formData.get('materialId') as string
        const audioFile = formData.get('audioFile') as File

        if (!materialId || !audioFile) {
            return NextResponse.json(
                { error: 'materialId and audioFile are required' },
                { status: 400 }
            )
        }

        // 자료 확인 (발표자 이름도 함께 조회)
        const material = await prisma.material.findUnique({
            where: { id: materialId },
            include: {
                transcription: true,
                presenter: { select: { name: true } },
            },
        })

        if (!material) {
            return NextResponse.json(
                { error: 'Material not found' },
                { status: 404 }
            )
        }

        // 기존 실패한 트랜스크립션 삭제
        if (material.transcription) {
            if (material.transcription.status === 'FAILED') {
                await prisma.meetingTranscription.delete({
                    where: { id: material.transcription.id }
                })
            } else {
                return NextResponse.json(
                    { error: 'Transcription already exists' },
                    { status: 400 }
                )
            }
        }

        // 오디오 파일 저장
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'audio')
        await mkdir(uploadDir, { recursive: true })

        const ext = audioFile.name.split('.').pop() || 'webm'
        const filename = `${materialId}_${Date.now()}.${ext}`
        const filePath = path.join(uploadDir, filename)

        const buffer = Buffer.from(await audioFile.arrayBuffer())
        await writeFile(filePath, buffer)

        const audioUrl = `/uploads/audio/${filename}`

        // 트랜스크립션 레코드 생성
        const transcription = await prisma.meetingTranscription.create({
            data: {
                materialId: material.id,
                recorderId: user.id,
                audioUrl,
                audioFilename: audioFile.name,
                status: 'PENDING',
            },
        })

        // 백그라운드에서 트랜스크립션 처리 시작
        const presenterName = material.presenter?.name || null
        processTranscription(transcription.id, filePath, presenterName).catch(err => {
            console.error('Transcription processing error:', err)
        })

        return NextResponse.json({
            transcriptionId: transcription.id,
            status: 'PENDING',
        })
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (error.message === 'Account not approved') {
            return NextResponse.json({ error: 'Account not approved' }, { status: 403 })
        }
        console.error('Upload transcription error:', error)
        return NextResponse.json(
            { error: 'Failed to upload transcription' },
            { status: 500 }
        )
    }
}

// 백그라운드 처리 함수
async function processTranscription(transcriptionId: string, audioPath: string, presenterName: string | null = null) {
    const TRANSCRIPTION_SERVICE_URL = process.env.TRANSCRIPTION_SERVICE_URL || 'http://localhost:8000'

    try {
        // 상태 업데이트: 처리 중
        await prisma.meetingTranscription.update({
            where: { id: transcriptionId },
            data: { status: 'PROCESSING', jobId: null },
        })

        // 1. 오디오 파일을 /process 엔드포인트로 업로드
        const { readFileSync } = await import('fs')
        const audioBuffer = readFileSync(audioPath)
        const audioBlob = new Blob([audioBuffer])

        const formData = new FormData()
        formData.append('file', audioBlob, path.basename(audioPath))
        // 발표자 이름을 context로 전달
        if (presenterName) {
            formData.append('context', `presenter:${presenterName}`)
        }

        const uploadResponse = await fetch(`${TRANSCRIPTION_SERVICE_URL}/process`, {
            method: 'POST',
            body: formData,
        })

        if (!uploadResponse.ok) {
            throw new Error(`Transcription service upload error: ${uploadResponse.status}`)
        }

        const { job_id } = await uploadResponse.json()

        // job_id 저장
        await prisma.meetingTranscription.update({
            where: { id: transcriptionId },
            data: { jobId: job_id },
        })

        // 2. 상태 폴링 (최대 30분, 10초 간격)
        const MAX_POLLS = 180
        const POLL_INTERVAL = 10000 // 10초

        for (let i = 0; i < MAX_POLLS; i++) {
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))

            const statusResponse = await fetch(`${TRANSCRIPTION_SERVICE_URL}/status/${job_id}`)
            const statusData = await statusResponse.json()

            if (statusData.status === 'completed') {
                // 3. 완료 시 결과 가져오기
                const resultResponse = await fetch(`${TRANSCRIPTION_SERVICE_URL}/result/${job_id}`)
                const resultData = await resultResponse.json()

                await prisma.meetingTranscription.update({
                    where: { id: transcriptionId },
                    data: {
                        status: 'COMPLETED',
                        transcript: resultData.transcript ? JSON.stringify(resultData.transcript) : null,
                        summary: resultData.summary || null,
                    },
                })
                return
            }

            if (statusData.status === 'failed') {
                throw new Error(statusData.error || 'Transcription failed')
            }

            // pending, transcribing, summarizing → 계속 폴링
        }

        throw new Error('Transcription timed out (30 minutes)')
    } catch (error: any) {
        console.error('Transcription processing failed:', error)

        await prisma.meetingTranscription.update({
            where: { id: transcriptionId },
            data: {
                status: 'FAILED',
                error: error.message || 'Unknown error',
            },
        })
    }
}
