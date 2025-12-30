import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

    // Get file path - check both private and public locations
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
        const fileBuffer = await readFile(filepath)

        // Set appropriate headers for download
        const headers = new Headers()
        headers.set('Content-Type', material.mimeType || 'application/octet-stream')
        headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(material.filename)}`)
        headers.set('Content-Length', material.size.toString())

        return new NextResponse(fileBuffer, {
            status: 200,
            headers
        })
    } catch (error) {
        console.error('File read error:', error)
        return NextResponse.json({ error: '파일 읽기 오류' }, { status: 500 })
    }
}
