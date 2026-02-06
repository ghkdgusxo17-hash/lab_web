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

        // 자료 확인
        const material = await prisma.material.findUnique({
            where: { id: materialId },
            include: { transcription: true },
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
        processTranscription(transcription.id, filePath).catch(err => {
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
async function processTranscription(transcriptionId: string, audioPath: string) {
    const TRANSCRIPTION_SERVICE_URL = process.env.TRANSCRIPTION_SERVICE_URL || 'http://localhost:5000'

    try {
        // 상태 업데이트: 처리 중
        await prisma.meetingTranscription.update({
            where: { id: transcriptionId },
            data: { status: 'PROCESSING' },
        })

        // 트랜스크립션 서비스 호출
        const { readFileSync } = await import('fs')
        const audioBuffer = readFileSync(audioPath)
        const audioBlob = new Blob([audioBuffer])

        const formData = new FormData()
        formData.append('audio', audioBlob, path.basename(audioPath))

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000) // 30분 타임아웃

        const response = await fetch(`${TRANSCRIPTION_SERVICE_URL}/transcribe`, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            throw new Error(`Transcription service error: ${response.status}`)
        }

        const result = await response.json()

        // 결과 저장
        await prisma.meetingTranscription.update({
            where: { id: transcriptionId },
            data: {
                status: 'COMPLETED',
                transcript: result.transcript,
                summary: result.summary,
            },
        })
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
