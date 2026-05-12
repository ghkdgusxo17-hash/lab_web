import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { join } from 'path'
import { existsSync, statSync, createReadStream } from 'fs'
import { Readable } from 'stream'
import { createSupabaseObjectUrl, parseStoredMaterialLocation } from '@/lib/lab-meeting-material-security'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return NextResponse.json({ error: '멤버만 다운로드할 수 있습니다.' }, { status: 403 })
    }

    const { id } = await params

    const material = await prisma.material.findUnique({
        where: { id },
    })

    if (!material) {
        return NextResponse.json({ error: '자료를 찾을 수 없습니다.' }, { status: 404 })
    }

    const headers = new Headers()
    headers.set('Content-Type', material.mimeType || 'application/octet-stream')
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(material.filename)}`)
    headers.set('Cache-Control', 'private, no-store, no-transform')
    headers.set('X-Accel-Buffering', 'no')
    headers.set('Accept-Ranges', 'bytes')

    const storedLocation = parseStoredMaterialLocation(material.url)
    if (storedLocation) {
        const rangeHeader = request.headers.get('range')

        try {
            const storageUrl = await createSupabaseObjectUrl(storedLocation, 60)
            const res = await fetch(storageUrl, {
                headers: rangeHeader ? { range: rangeHeader } : undefined,
                cache: 'no-store',
            })

            if (!res.ok && res.status !== 206) {
                return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 })
            }

            const contentLength = res.headers.get('content-length')
            const contentRange = res.headers.get('content-range')
            const acceptRanges = res.headers.get('accept-ranges')

            if (contentLength) {
                headers.set('Content-Length', contentLength)
            }

            if (contentRange) {
                headers.set('Content-Range', contentRange)
            }

            if (acceptRanges) {
                headers.set('Accept-Ranges', acceptRanges)
            }

            return new NextResponse(res.body, { status: res.status, headers })
        } catch (error) {
            console.error('Supabase fetch error:', error)
            return NextResponse.json({ error: '파일 읽기 오류' }, { status: 500 })
        }
    }

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
