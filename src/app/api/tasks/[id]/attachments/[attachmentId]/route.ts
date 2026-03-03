import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { join } from 'path'
import { existsSync, statSync, createReadStream } from 'fs'
import { Readable } from 'stream'

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

    // Get task and verify access
    const task = await prisma.task.findUnique({
        where: { id: taskId }
    })

    if (!task) {
        return NextResponse.json({ error: '작업을 찾을 수 없습니다.' }, { status: 404 })
    }

    // Access check: only author or admin
    if (task.authorId !== session.user.id && !session.user.isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // Get attachment
    const attachment = await prisma.taskAttachment.findUnique({
        where: { id: attachmentId }
    })

    if (!attachment || attachment.taskId !== taskId) {
        return NextResponse.json({ error: '첨부파일을 찾을 수 없습니다.' }, { status: 404 })
    }

    // Get file
    const filename = attachment.url.replace('/uploads/task-attachments/', '')
    const filepath = join(process.cwd(), 'uploads', 'task-attachments', filename)

    if (!existsSync(filepath)) {
        return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 })
    }

    try {
        const stat = statSync(filepath)
        const nodeStream = createReadStream(filepath)
        const webStream = Readable.toWeb(nodeStream) as ReadableStream

        const headers = new Headers()
        headers.set('Content-Type', attachment.mimeType || 'application/octet-stream')
        headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`)
        headers.set('Content-Length', stat.size.toString())
        headers.set('Cache-Control', 'no-store, no-transform')
        headers.set('X-Accel-Buffering', 'no')

        return new NextResponse(webStream, { status: 200, headers })
    } catch (error) {
        console.error('File read error:', error)
        return NextResponse.json({ error: '파일 읽기 오류' }, { status: 500 })
    }
}
