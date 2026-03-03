'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { STORAGE_BUCKET, getProxyUrl, extractStoragePath } from '@/lib/storage-constants'

// Get partitions by category (DATA or OTHER)
export async function getPartitions(category: string) {
    const partitions = await prisma.materialPartition.findMany({
        where: { category },
        include: {
            creator: {
                select: { id: true, name: true, image: true }
            },
            _count: {
                select: { materials: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return partitions.map(p => ({
        ...p,
        materialsCount: p._count.materials
    }))
}

// Get single partition with materials
export async function getPartition(id: string) {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    const partition = await prisma.materialPartition.findUnique({
        where: { id },
        include: {
            creator: {
                select: { id: true, name: true, image: true }
            },
            materials: {
                include: {
                    uploader: {
                        select: { id: true, name: true, image: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    return partition
}

// Create partition (Approved members only)
export async function createPartition(formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "승인된 멤버만 파티션을 생성할 수 있습니다." }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const emoji = formData.get('emoji') as string || '📁'
    const color = formData.get('color') as string || '#3B82F6'
    const category = formData.get('category') as string

    if (!name) {
        return { error: "파티션 이름을 입력해주세요." }
    }

    if (category !== 'PPT' && category !== 'DATA' && category !== 'OTHER') {
        return { error: "유효하지 않은 카테고리입니다." }
    }

    try {
        const partition = await prisma.materialPartition.create({
            data: {
                name,
                description: description || null,
                emoji,
                color,
                category,
                creatorId: session.user.id
            }
        })

        revalidatePath('/materials')
        return { success: true, id: partition.id }
    } catch (error) {
        console.error('Create partition error:', error)
        return { error: "파티션 생성 중 오류가 발생했습니다." }
    }
}

// Update partition (Creator or Admin only)
export async function updatePartition(id: string, formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const partition = await prisma.materialPartition.findUnique({
        where: { id }
    })

    if (!partition) {
        return { error: "파티션을 찾을 수 없습니다." }
    }

    if (partition.creatorId !== session.user.id && !session.user.isAdmin) {
        return { error: "수정 권한이 없습니다." }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const emoji = formData.get('emoji') as string || partition.emoji
    const color = formData.get('color') as string || partition.color

    if (!name) {
        return { error: "파티션 이름을 입력해주세요." }
    }

    try {
        await prisma.materialPartition.update({
            where: { id },
            data: {
                name,
                description: description || null,
                emoji,
                color
            }
        })

        revalidatePath('/materials')
        revalidatePath(`/materials/partition/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Update partition error:', error)
        return { error: "파티션 수정 중 오류가 발생했습니다." }
    }
}

// Delete partition (Creator or Admin only) — files are preserved (partitionId → null)
export async function deletePartition(id: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const partition = await prisma.materialPartition.findUnique({
        where: { id }
    })

    if (!partition) {
        return { error: "파티션을 찾을 수 없습니다." }
    }

    if (partition.creatorId !== session.user.id && !session.user.isAdmin) {
        return { error: "삭제 권한이 없습니다." }
    }

    try {
        // onDelete: SetNull ensures materials keep their partitionId as null
        await prisma.materialPartition.delete({
            where: { id }
        })

        revalidatePath('/materials')
        return { success: true, category: partition.category }
    } catch (error) {
        console.error('Delete partition error:', error)
        return { error: "파티션 삭제 중 오류가 발생했습니다." }
    }
}

// Upload material to a partition
export async function uploadPartitionMaterial(partitionId: string, formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "승인된 멤버만 자료를 업로드할 수 있습니다." }
    }

    const partition = await prisma.materialPartition.findUnique({
        where: { id: partitionId }
    })

    if (!partition) {
        return { error: "파티션을 찾을 수 없습니다." }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const file = formData.get('file') as File

    if (!title || !file) {
        return { error: "제목과 파일을 입력해주세요." }
    }

    try {
        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filename = `${timestamp}_${safeName}`
        const filePath = `materials/${filename}`

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

        await prisma.material.create({
            data: {
                title,
                description: description || null,
                category: partition.category,
                filename: file.name,
                url: getProxyUrl(filePath),
                size: file.size,
                mimeType: file.type,
                uploaderId: session.user.id,
                partitionId
            }
        })

        revalidatePath(`/materials/partition/${partitionId}`)
        revalidatePath('/materials')
        return { success: true }
    } catch (error) {
        console.error('Upload error:', error)
        return { error: "파일 업로드 중 오류가 발생했습니다." }
    }
}

// Delete material from a partition
export async function deletePartitionMaterial(materialId: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const material = await prisma.material.findUnique({
        where: { id: materialId }
    })

    if (!material) {
        return { error: "자료를 찾을 수 없습니다." }
    }

    if (material.uploaderId !== session.user.id && !session.user.isAdmin) {
        return { error: "삭제 권한이 없습니다." }
    }

    try {
        const storagePath = extractStoragePath(material.url)
        if (storagePath) {
            await supabaseAdmin.storage
                .from(STORAGE_BUCKET)
                .remove([storagePath])
        }

        await prisma.material.delete({
            where: { id: materialId }
        })

        if (material.partitionId) {
            revalidatePath(`/materials/partition/${material.partitionId}`)
        }
        revalidatePath('/materials')
        return { success: true }
    } catch (error) {
        console.error('Delete error:', error)
        return { error: "삭제 중 오류가 발생했습니다." }
    }
}
