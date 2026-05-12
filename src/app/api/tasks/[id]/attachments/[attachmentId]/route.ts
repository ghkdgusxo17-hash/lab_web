import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { join } from 'path'
import { existsSync, statSync, createReadStream } from 'fs'
import { Readable } from 'stream'
import { extractStoragePath } from '@/lib/storage-constants'
import { createStorageObjectUrl } from '@/lib/storage-admin'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id: taskId, attachmentId } = await params

    const task = await prisma.task.findUnique({
        where: { id: taskId },
    })

    if (!task) {
        return NextResponse.json({ error: '작업을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (task.authorId !== session.user.id && !session.user.isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const attachment = await prisma.taskAttachment.findUnique({
        where: { id: attachmentId },
    })

    if (!attachment || attachment.taskId !== taskId) {
        return NextResponse.json({ error: '첨부파일을 찾을 수 없습니다.' }, { status: 404 })
    }

    try {
        const storagePath = extractStoragePath(attachment.url)
        if (storagePath) {
            const rangeHeader = request.headers.get('range')
            const sourceUrl = await createStorageObjectUrl(storagePath, 60)
            const response = await fetch(sourceUrl, {
                headers: rangeHeader ? { range: rangeHeader } : undefined,
                cache: 'no-store',
            })

            if (!response.ok && response.status !== 206) {
                return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 })
            }

            const headers = new Headers()
            headers.set('Content-Type', response.headers.get('content-type') || attachment.mimeType || 'application/octet-stream')
            headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`)
            headers.set('Cache-Control', 'private, no-store, no-transform')
            headers.set('X-Accel-Buffering', 'no')

            const contentLength = response.headers.get('content-length')
            const contentRange = response.headers.get('content-range')
            const acceptRanges = response.headers.get('accept-ranges')

            if (contentLength) headers.set('Content-Length', contentLength)
            if (contentRange) headers.set('Content-Range', contentRange)
            if (acceptRanges) headers.set('Accept-Ranges', acceptRanges)

            return new NextResponse(response.body, { status: response.status, headers })
        }

        const filename = attachment.url.replace('/uploads/task-attachments/', '')
        const filepath = join(process.cwd(), 'uploads', 'task-attachments', filename)

        if (!existsSync(filepath)) {
            return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 })
        }

        const stat = statSync(filepath)
        const nodeStream = createReadStream(filepath)
        const webStream = Readable.toWeb(nodeStream) as ReadableStream

        const headers = new Headers()
        headers.set('Content-Type', attachment.mimeType || 'application/octet-stream')
        headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`)
        headers.set('Content-Length', stat.size.toString())
        headers.set('Cache-Control', 'private, no-store, no-transform')
        headers.set('X-Accel-Buffering', 'no')

        return new NextResponse(webStream, { status: 200, headers })
    } catch (error) {
        console.error('File read error:', error)
        return NextResponse.json({ error: '파일 읽기 오류' }, { status: 500 })
    }
}
