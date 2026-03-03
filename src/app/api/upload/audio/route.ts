import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { STORAGE_BUCKET, getProxyUrl } from '@/lib/storage-constants'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const TEMP_DIR = path.join(process.cwd(), '.tmp', 'audio-chunks')

// POST: Receive a single chunk
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
        }

        if (!session.user.isApproved && !session.user.isAdmin) {
            return NextResponse.json({ error: '승인된 멤버만 사용할 수 있습니다.' }, { status: 403 })
        }

        const formData = await request.formData()
        const chunk = formData.get('chunk') as File
        const uploadId = formData.get('uploadId') as string
        const chunkIndex = parseInt(formData.get('chunkIndex') as string, 10)
        const totalChunks = parseInt(formData.get('totalChunks') as string, 10)
        const originalFilename = formData.get('filename') as string

        if (!chunk || !uploadId || isNaN(chunkIndex) || isNaN(totalChunks)) {
            return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
        }

        // Validate on first chunk
        if (chunkIndex === 0) {
            const allowedExtensions = ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'webm', 'mp4']
            const ext = originalFilename.split('.').pop()?.toLowerCase() || ''
            if (!allowedExtensions.includes(ext)) {
                return NextResponse.json({ error: '지원하지 않는 오디오 형식입니다.' }, { status: 400 })
            }
        }

        // Save chunk to temp directory
        const uploadDir = path.join(TEMP_DIR, uploadId)
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        const chunkBuffer = Buffer.from(await chunk.arrayBuffer())
        await writeFile(path.join(uploadDir, `chunk_${chunkIndex}`), chunkBuffer)

        // If this is the last chunk, assemble and upload to Supabase
        if (chunkIndex === totalChunks - 1) {
            // Assemble all chunks
            const chunks: Buffer[] = []
            for (let i = 0; i < totalChunks; i++) {
                const chunkPath = path.join(uploadDir, `chunk_${i}`)
                chunks.push(await readFile(chunkPath))
            }
            const fullBuffer = Buffer.concat(chunks)

            // Upload to Supabase (localhost, fast)
            const timestamp = Date.now()
            const safeName = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_')
            const filename = `${timestamp}_${safeName}`
            const filePath = `transcriptions/${filename}`

            const { error: uploadError } = await supabaseAdmin.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, fullBuffer, {
                    contentType: 'audio/mpeg',
                    upsert: true,
                })

            // Clean up temp files
            for (let i = 0; i < totalChunks; i++) {
                const chunkPath = path.join(uploadDir, `chunk_${i}`)
                await unlink(chunkPath).catch(() => {})
            }
            const { rmdir } = await import('fs/promises')
            await rmdir(uploadDir).catch(() => {})

            if (uploadError) {
                console.error('Audio upload error:', uploadError)
                return NextResponse.json({ error: '오디오 파일 업로드 중 오류가 발생했습니다.' }, { status: 500 })
            }

            return NextResponse.json({
                done: true,
                filePath,
                proxyUrl: getProxyUrl(filePath),
                originalFilename,
            })
        }

        // Not the last chunk - acknowledge receipt
        return NextResponse.json({ done: false, chunkIndex })
    } catch (error: any) {
        if (error?.code === 'ECONNRESET') return new NextResponse(null, { status: 499 })
        console.error('Chunk upload error:', error)
        return NextResponse.json({ error: '업로드 중 오류가 발생했습니다.' }, { status: 500 })
    }
}
