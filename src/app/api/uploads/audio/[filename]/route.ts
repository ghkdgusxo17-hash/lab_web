import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params

    // Sanitize filename to prevent path traversal
    const safeName = path.basename(filename)
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'audio', safeName)

    try {
        const fileStat = await stat(filePath)
        const buffer = await readFile(filePath)

        const ext = path.extname(safeName).toLowerCase()
        const mimeTypes: Record<string, string> = {
            '.webm': 'audio/webm',
            '.mp3': 'audio/mpeg',
            '.m4a': 'audio/mp4',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.flac': 'audio/flac',
        }
        const contentType = mimeTypes[ext] || 'application/octet-stream'

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': fileStat.size.toString(),
                'Accept-Ranges': 'bytes',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Cache-Control': 'public, max-age=86400',
            },
        })
    } catch {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
}
