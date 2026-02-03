import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params
    const filePath = path.join('/')

    // Construct the local Supabase storage URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
    const storageUrl = `${supabaseUrl}/storage/v1/object/public/${filePath}`

    try {
        const response = await fetch(storageUrl)

        if (!response.ok) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream'
        const buffer = await response.arrayBuffer()

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        })
    } catch (error) {
        console.error('Storage proxy error:', error)
        return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
    }
}
