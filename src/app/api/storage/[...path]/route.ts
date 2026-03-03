import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CACHEABLE_TYPES = ['image/', 'font/', 'text/css', 'application/javascript']

function getSupabaseUrl(filePath: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
    return `${supabaseUrl}/storage/v1/object/public/${filePath}`
}

// HEAD handler: returns metadata without fetching the full file
export async function HEAD(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params
    const storageUrl = getSupabaseUrl(path.join('/'))

    const res = await fetch(storageUrl, { method: 'HEAD' })
    if (!res.ok) {
        return new NextResponse(null, { status: 404 })
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream'
    const contentLength = res.headers.get('content-length') || '0'

    return new NextResponse(null, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Content-Length': contentLength,
            'Accept-Ranges': 'bytes',
        },
    })
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params
    const filePath = path.join('/')
    const storageUrl = getSupabaseUrl(filePath)

    try {
        const response = await fetch(storageUrl)
        if (!response.ok) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream'
        const isCacheable = CACHEABLE_TYPES.some(t => contentType.startsWith(t))
        const cacheControl = isCacheable
            ? 'public, max-age=31536000, immutable'
            : 'no-store, no-transform'

        // Fetch full file from local Supabase (fast over localhost)
        const buffer = await response.arrayBuffer()
        const totalSize = buffer.byteLength

        // Handle Range requests (chunked download from browser)
        const rangeHeader = request.headers.get('range')
        if (rangeHeader && totalSize > 0) {
            const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
            if (match) {
                const start = parseInt(match[1], 10)
                const end = match[2] ? parseInt(match[2], 10) : totalSize - 1

                if (start >= totalSize) {
                    return new NextResponse(null, {
                        status: 416,
                        headers: { 'Content-Range': `bytes */${totalSize}` },
                    })
                }

                const slice = buffer.slice(start, end + 1)

                return new NextResponse(slice, {
                    status: 206,
                    headers: {
                        'Content-Type': contentType,
                        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                        'Content-Length': String(slice.byteLength),
                        'Accept-Ranges': 'bytes',
                        'Cache-Control': cacheControl,
                        'X-Accel-Buffering': 'no',
                    },
                })
            }
        }

        // Full file response
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': String(totalSize),
                'Accept-Ranges': 'bytes',
                'Cache-Control': cacheControl,
                'X-Accel-Buffering': 'no',
            },
        })
    } catch (error: any) {
        // ECONNRESET is expected when Cloudflare drops slow connections - don't log as error
        if (error?.code === 'ECONNRESET') return new NextResponse(null, { status: 499 })
        console.error('Storage proxy error:', error)
        return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
    }
}
