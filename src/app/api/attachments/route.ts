import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { STORAGE_BUCKET } from '@/lib/storage-constants'

export const dynamic = 'force-dynamic'

// 허용되는 파일 타입
const ALLOWED_TYPES = [
    // 문서
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/x-hwp',
    'application/haansofthwp',
    'text/plain',
    // 압축
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    // 이미지
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // 오디오
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
    'audio/x-m4a',
    // 비디오
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
]

// 파일 확장자로 타입 확인 (일부 브라우저에서 MIME 타입이 빈 경우 대비)
function isAllowedExtension(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase()
    const allowedExtensions = [
        'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'hwp', 'txt',
        'zip', 'rar', '7z',
        'jpg', 'jpeg', 'png', 'gif', 'webp',
        'mp3', 'wav', 'ogg', 'webm', 'm4a',
        'mp4', 'avi', 'mov'
    ]
    return ext ? allowedExtensions.includes(ext) : false
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
        }

        // 승인된 멤버만 업로드 가능
        if (!session.user.isApproved && !session.user.isAdmin) {
            return NextResponse.json({ error: '승인된 멤버만 파일을 업로드할 수 있습니다.' }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
        }

        // 파일 타입 검증
        const isAllowedType = ALLOWED_TYPES.includes(file.type) || isAllowedExtension(file.name)
        if (!isAllowedType) {
            return NextResponse.json({ error: '허용되지 않는 파일 형식입니다.' }, { status: 400 })
        }

        // 파일 크기 검증 (100MB - Cloudflare 무료 플랜 제한)
        const MAX_SIZE = 100 * 1024 * 1024 // 100MB
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: '파일 크기는 100MB 이하여야 합니다.' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // 고유 파일명 생성
        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filename = `${timestamp}_${safeName}`
        const filePath = `attachments/${filename}`

        // Supabase Storage에 업로드
        const { error: uploadError } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true,
            })

        if (uploadError) {
            console.error('Supabase upload error:', uploadError)
            return NextResponse.json({ error: '업로드 중 오류가 발생했습니다.' }, { status: 500 })
        }

        // Return proxy URL instead of direct Supabase URL
        // This allows files to be accessed via the same domain (works with Cloudflare tunnel)
        const proxyUrl = `/api/storage/${STORAGE_BUCKET}/${filePath}`

        return NextResponse.json({ url: proxyUrl })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: '업로드 중 오류가 발생했습니다.' }, { status: 500 })
    }
}
