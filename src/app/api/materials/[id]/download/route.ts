import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { join } from 'path'
import { existsSync, statSync, createReadStream } from 'fs'
import { Readable } from 'stream'
import { extractStoragePath } from '@/lib/storage-constants'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Check authentication
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // Check if user is approved member or admin
    if (!session.user.isApproved && !session.user.isAdmin) {
        return NextResponse.json({ error: '멤버만 다운로드할 수 있습니다.' }, { status: 403 })
    }

    const { id } = await params

    // Get material from database
    const material = await prisma.material.findUnique({
        where: { id }
    })

    if (!material) {
        return NextResponse.json({ error: '자료를 찾을 수 없습니다.' }, { status: 404 })
    }

    const headers = new Headers()
    headers.set('Content-Type', material.mimeType || 'application/octet-stream')
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(material.filename)}`)
    headers.set('Cache-Control', 'no-store, no-transform')
    headers.set('X-Accel-Buffering', 'no')
    headers.set('Accept-Ranges', 'bytes')

    // Check if file is in Supabase Storage (proxy URL or direct URL)
    const storagePath = extractStoragePath(material.url)
    if (storagePath) {
        // Fetch from Supabase Storage
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
        const storageUrl = `${supabaseUrl}/storage/v1/object/public/uploads/${storagePath}`

        try {
            const res = await fetch(storageUrl)
            if (!res.ok) {
                return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 })
            }

            const buffer = await res.arrayBuffer()
            headers.set('Content-Length', String(buffer.byteLength))

            // Handle Range requests
            const rangeHeader = request.headers.get('range')
            if (rangeHeader) {
                const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
                if (match) {
                    const start = parseInt(match[1], 10)
                    const end = match[2] ? parseInt(match[2], 10) : buffer.byteLength - 1
                    const slice = buffer.slice(start, end + 1)
                    headers.set('Content-Range', `bytes ${start}-${end}/${buffer.byteLength}`)
                    headers.set('Content-Length', String(slice.byteLength))
                    return new NextResponse(slice, { status: 206, headers })
                }
            }

            return new NextResponse(buffer, { status: 200, headers })
        } catch (error) {
            console.error('Supabase fetch error:', error)
            return NextResponse.json({ error: '파일 읽기 오류' }, { status: 500 })
        }
    }

    // Legacy: file on local filesystem
    const privatePath = join(process.cwd(), 'uploads', 'materials', material.url.replace('/uploads/materials/', ''))
    const publicPath = join(process.cwd(), 'public', material.url)

    let filepath = ''
    if (existsSync(privatePath)) {
        filepath = privatePath
    } else if (existsSync(publicPath)) {
        filepath = publicPath
    } else {
        return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 })
    }

    try {
        const stat = statSync(filepath)
        const nodeStream = createReadStream(filepath)
        const webStream = Readable.toWeb(nodeStream) as ReadableStream

        headers.set('Content-Length', stat.size.toString())

        return new NextResponse(webStream, { status: 200, headers })
    } catch (error: any) {
        if (error?.code === 'ECONNRESET') return new NextResponse(null, { status: 499 })
        console.error('File read error:', error)
        return NextResponse.json({ error: '파일 읽기 오류' }, { status: 500 })
    }
}
