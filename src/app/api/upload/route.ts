import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { STORAGE_BUCKET } from '@/lib/storage-constants'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
        }

        // Check file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다.' }, { status: 400 })
        }

        // Check file size (max 5GB)
        if (file.size > 5 * 1024 * 1024 * 1024) {
            return NextResponse.json({ error: '파일 크기는 5GB 이하여야 합니다.' }, { status: 400 })
        }

        // Get current user's image to delete old one
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { image: true }
        })

        // Delete old profile image if exists (and it's from our storage)
        if (currentUser?.image && currentUser.image.includes('/storage/v1/object/public/uploads/profiles/')) {
            const oldPath = currentUser.image.split('/storage/v1/object/public/uploads/')[1]
            if (oldPath) {
                await supabaseAdmin.storage
                    .from(STORAGE_BUCKET)
                    .remove([oldPath])
            }
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Create unique filename
        const ext = file.name.split('.').pop()
        const filename = `${session.user.id}-${Date.now()}.${ext}`
        const filePath = `profiles/${filename}`

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true,
            })

        if (uploadError) {
            console.error('Supabase upload error:', uploadError)
            return NextResponse.json({ error: '업로드 중 오류가 발생했습니다.' }, { status: 500 })
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath)

        return NextResponse.json({ url: urlData.publicUrl })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: '업로드 중 오류가 발생했습니다.' }, { status: 500 })
    }
}
