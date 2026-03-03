import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { join } from 'path'
import { existsSync, statSync, createReadStream } from 'fs'
import { Readable } from 'stream'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'workspace')

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ resourceId: string }> }
) {
    const { resourceId } = await params
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get resource
    const resource = await prisma.workspaceResource.findUnique({
        where: { id: resourceId },
        include: { workspace: true }
    })

    if (!resource) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Check membership
    const membership = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: { workspaceId: resource.workspaceId, userId: session.user.id }
        }
    })

    if (!membership && !session.user.isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only files can be downloaded
    if (resource.type !== 'FILE' || !resource.filename) {
        return NextResponse.json({ error: 'Not a file' }, { status: 400 })
    }

    // Get file path
    const filename = resource.url.replace('/uploads/workspace/', '')
    const filepath = join(UPLOAD_DIR, filename)

    if (!existsSync(filepath)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    try {
        const stat = statSync(filepath)
        const nodeStream = createReadStream(filepath)
        const webStream = Readable.toWeb(nodeStream) as ReadableStream

        return new NextResponse(webStream, {
            headers: {
                'Content-Type': resource.mimeType || 'application/octet-stream',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(resource.filename!)}`,
                'Content-Length': String(resource.size || stat.size),
                'Cache-Control': 'no-store, no-transform',
                'X-Accel-Buffering': 'no',
            },
        })
    } catch (error) {
        console.error('Download error:', error)
        return NextResponse.json({ error: 'Download failed' }, { status: 500 })
    }
}
