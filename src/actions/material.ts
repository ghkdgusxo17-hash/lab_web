'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { STORAGE_BUCKET } from '@/lib/storage-constants'

// Get all materials
export async function getMaterials(category?: string, userId?: string, search?: string) {
    const where: any = {}

    if (category && category !== 'ALL') {
        where.category = category
    }

    if (userId) {
        where.uploaderId = userId
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { filename: { contains: search, mode: 'insensitive' } }
        ]
    }

    const materials = await prisma.material.findMany({
        where,
        include: {
            uploader: {
                select: { id: true, name: true, image: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return materials
}

// Get uploaders for member filter
export async function getMaterialUploaders() {
    const uploaders = await prisma.user.findMany({
        where: {
            materials: {
                some: {}
            }
        },
        select: {
            id: true,
            name: true,
            image: true,
            _count: {
                select: { materials: true }
            }
        },
        orderBy: { name: 'asc' }
    })

    return uploaders
}

// Upload material (Approved members only)
export async function uploadMaterial(formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "승인된 멤버만 자료를 업로드할 수 있습니다." }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string || 'OTHER'
    const file = formData.get('file') as File

    if (!title || !file) {
        return { error: "제목과 파일을 입력해주세요." }
    }

    try {
        // Generate unique filename
        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filename = `${timestamp}_${safeName}`
        const filePath = `materials/${filename}`

        // Upload to Supabase Storage
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const { error: uploadError } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true,
            })

        if (uploadError) {
            console.error('Supabase upload error:', uploadError)
            return { error: "파일 업로드 중 오류가 발생했습니다." }
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath)

        // Create database record
        await prisma.material.create({
            data: {
                title,
                description: description || null,
                category,
                filename: file.name,
                url: urlData.publicUrl,
                size: file.size,
                mimeType: file.type,
                uploaderId: session.user.id
            }
        })

        revalidatePath('/materials')
        return { success: true }
    } catch (error) {
        console.error('Upload error:', error)
        return { error: "파일 업로드 중 오류가 발생했습니다." }
    }
}

// Delete material (Author or Admin only)
export async function deleteMaterial(id: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const material = await prisma.material.findUnique({
        where: { id }
    })

    if (!material) {
        return { error: "자료를 찾을 수 없습니다." }
    }

    // Only uploader or admin can delete
    if (material.uploaderId !== session.user.id && !session.user.isAdmin) {
        return { error: "삭제 권한이 없습니다." }
    }

    try {
        // Delete from Supabase Storage
        // Extract file path from URL
        const urlParts = material.url.split('/storage/v1/object/public/uploads/')
        if (urlParts.length > 1) {
            const filePath = urlParts[1]
            await supabaseAdmin.storage
                .from(STORAGE_BUCKET)
                .remove([filePath])
        }

        // Delete database record
        await prisma.material.delete({
            where: { id }
        })

        revalidatePath('/materials')
        return { success: true }
    } catch (error) {
        console.error('Delete error:', error)
        return { error: "삭제 중 오류가 발생했습니다." }
    }
}
