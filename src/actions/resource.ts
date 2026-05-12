'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { STORAGE_BUCKET, getProxyUrl } from '@/lib/storage-constants'
import { Resource } from '@prisma/client'

// Image Upload
export async function uploadResourceImage(formData: FormData) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        return { error: "관리자만 업로드할 수 있습니다." }
    }

    const file = formData.get('file') as File
    if (!file) {
        return { error: "파일이 없습니다." }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `resources/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
            contentType: file.type,
            upsert: false
        })

    if (uploadError) {
        console.error('Upload error:', uploadError)
        return { error: "이미지 업로드 실패" }
    }

    return { success: true, url: getProxyUrl(filePath) }
}

// Create Resource
export async function createResource(data: {
    name: string
    description?: string
    type: string
    image?: string
    isAvailable: boolean
}) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        return { error: "관리자만 생성할 수 있습니다." }
    }

    try {
        const resource = await prisma.resource.create({
            data: {
                ...data,
                // Default image if none provided
                image: data.image || null
            }
        })
        revalidatePath('/reservations')
        revalidatePath('/admin')
        return { success: true, resource }
    } catch (error) {
        console.error('Create resource error:', error)
        return { error: "장비 생성 실패" }
    }
}

// Update Resource
export async function updateResource(id: string, data: {
    name?: string
    description?: string
    type?: string
    image?: string
    isAvailable?: boolean
}) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        return { error: "관리자만 수정할 수 있습니다." }
    }

    try {
        const resource = await prisma.resource.update({
            where: { id },
            data
        })
        revalidatePath('/reservations')
        revalidatePath(`/reservations/${id}`)
        revalidatePath('/admin')
        return { success: true, resource }
    } catch (error) {
        console.error('Update resource error:', error)
        return { error: "장비 수정 실패" }
    }
}

// Delete Resource
export async function deleteResource(id: string) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        return { error: "관리자만 삭제할 수 있습니다." }
    }

    try {
        await prisma.resource.delete({
            where: { id }
        })
        revalidatePath('/reservations')
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error('Delete resource error:', error)
        return { error: "장비 삭제 실패" }
    }
}


// Get all resources
export async function getResources() {
    const resources = await prisma.resource.findMany({
        orderBy: { createdAt: 'asc' }
    })
    return resources
}

// Get single resource
export async function getResource(id: string) {
    const resource = await prisma.resource.findUnique({
        where: { id }
    })
    return resource
}

// Initialize default resources (run once)
export async function initializeResources() {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 초기화할 수 있습니다." }
    }

    const existingCount = await prisma.resource.count()
    if (existingCount > 0) {
        return { message: "이미 자원이 등록되어 있습니다.", count: existingCount }
    }

    const defaultResources = [
        { name: 'Amine Absorption', description: 'CO2 흡수 실험 장비', type: 'EQUIPMENT' },
        { name: 'Autosorb', description: '흡착 분석 장비', type: 'EQUIPMENT' },
        { name: '5070 Workstation', description: '고성능 연산 워크스테이션', type: 'EQUIPMENT' },
        { name: 'CLC', description: 'CLC 분석 장비', type: 'EQUIPMENT' },
    ]

    await prisma.resource.createMany({
        data: defaultResources
    })

    revalidatePath('/reservations')
    return { success: true, count: defaultResources.length }
}

// Toggle resource availability (Admin only)
export async function toggleResourceAvailability(id: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 수정할 수 있습니다." }
    }

    const resource = await prisma.resource.findUnique({ where: { id } })

    if (!resource) {
        return { error: "자원을 찾을 수 없습니다." }
    }

    await prisma.resource.update({
        where: { id },
        data: { isAvailable: !resource.isAvailable }
    })

    revalidatePath('/reservations')
    return { success: true }
}
