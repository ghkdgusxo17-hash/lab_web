import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createStorageObjectUrl } from '@/lib/storage-admin'
import { getStorageAccessLevel } from '@/lib/storage-policy'
import { STORAGE_BUCKET } from '@/lib/storage-constants'

export const dynamic = 'force-dynamic'

const CACHEABLE_TYPES = ['image/', 'font/', 'text/css', 'application/javascript']

function normalizeStoragePath(pathSegments: string[]) {
    if (!Array.isArray(pathSegments) || pathSegments.length < 2) {
        return null
    }

    try {
        const decodedSegments = pathSegments.map((segment) => decodeURIComponent(segment))

        const isInvalid = decodedSegments.some(
            (segment) =>
                !segment ||
                segment === '.' ||
                segment === '..' ||
                segment.includes('/') ||
                segment.includes('\\') ||
                segment.includes('\0')
        )

        if (isInvalid) {
            return null
        }

        return decodedSegments.join('/')
    } catch {
        return null
    }
}

async function ensureStorageAccess(filePath: string) {
    const accessLevel = getStorageAccessLevel(filePath)

    if (accessLevel === 'public') {
        return null
    }

    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    if (accessLevel === 'member' && !session.user.isApproved && !session.user.isAdmin) {
        return NextResponse.json({ error: '승인된 멤버만 접근 가능합니다.' }, { status: 403 })
    }

    return null
}

// HEAD handler: returns metadata without fetching the full file
export async function HEAD(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params
    const [bucket, ...fileSegments] = path

    if (bucket !== STORAGE_BUCKET) {
        return NextResponse.json({ error: '지원하지 않는 버킷입니다.' }, { status: 404 })
    }

    const filePath = normalizeStoragePath(fileSegments)

    if (!filePath) {
        return NextResponse.json({ error: '잘못된 파일 경로입니다.' }, { status: 400 })
    }

    const accessError = await ensureStorageAccess(filePath)
    if (accessError) {
        return accessError
    }

    const storageUrl = await createStorageObjectUrl(filePath, 60)

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
            'Cache-Control':
                getStorageAccessLevel(filePath) === 'public'
                    ? 'public, max-age=31536000, immutable'
                    : 'private, no-store',
        },
    })
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params
    const [bucket, ...fileSegments] = path

    if (bucket !== STORAGE_BUCKET) {
        return NextResponse.json({ error: '지원하지 않는 버킷입니다.' }, { status: 404 })
    }

    const filePath = normalizeStoragePath(fileSegments)

    if (!filePath) {
        return NextResponse.json({ error: '잘못된 파일 경로입니다.' }, { status: 400 })
    }

    const accessError = await ensureStorageAccess(filePath)
    if (accessError) {
        return accessError
    }

    const accessLevel = getStorageAccessLevel(filePath)
    const storageUrl = await createStorageObjectUrl(filePath, 60)

    try {
        const response = await fetch(storageUrl)
        if (!response.ok) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream'
        const isCacheable = CACHEABLE_TYPES.some(t => contentType.startsWith(t))
        const cacheControl = accessLevel === 'public' && isCacheable
            ? 'public, max-age=31536000, immutable'
            : 'private, no-store, no-transform'

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
