'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { STORAGE_BUCKET } from '@/lib/storage-constants'

// Add file resource
export async function addFileResource(workspaceId: string, formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    // Check membership
    const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: session.user.id } }
    })

    if (!membership && !session.user.isAdmin) {
        return { error: "멤버만 자료를 추가할 수 있습니다." }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const sectionId = formData.get('sectionId') as string | null
    const file = formData.get('file') as File

    if (!title || !file) {
        return { error: "제목과 파일을 입력해주세요." }
    }

    try {
        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filename = `${timestamp}_${safeName}`
        const filePath = `workspace/${filename}`

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

        const { data: urlData } = supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath)

        await prisma.workspaceResource.create({
            data: {
                workspaceId,
                sectionId: sectionId || null,
                title,
                description: description || null,
                type: 'FILE',
                filename: file.name,
                url: urlData.publicUrl,
                size: file.size,
                mimeType: file.type,
                uploaderId: session.user.id
            }
        })

        revalidatePath(`/workspaces/${workspaceId}`)
        return { success: true }
    } catch (error) {
        console.error('Upload error:', error)
        return { error: "파일 업로드 중 오류가 발생했습니다." }
    }
}

// Add link resource
export async function addLinkResource(workspaceId: string, formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    // Check membership
    const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: session.user.id } }
    })

    if (!membership && !session.user.isAdmin) {
        return { error: "멤버만 자료를 추가할 수 있습니다." }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const sectionId = formData.get('sectionId') as string | null
    const url = formData.get('url') as string

    if (!title || !url) {
        return { error: "제목과 링크를 입력해주세요." }
    }

    // Simple URL validation
    try {
        new URL(url)
    } catch {
        return { error: "유효한 URL을 입력해주세요." }
    }

    await prisma.workspaceResource.create({
        data: {
            workspaceId,
            sectionId: sectionId || null,
            title,
            description: description || null,
            type: 'LINK',
            url,
            uploaderId: session.user.id
        }
    })

    revalidatePath(`/workspaces/${workspaceId}`)
    return { success: true }
}

// Delete resource (uploader or leader)
export async function deleteWorkspaceResource(id: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const resource = await prisma.workspaceResource.findUnique({
        where: { id },
        include: { workspace: true }
    })

    if (!resource) {
        return { error: "자료를 찾을 수 없습니다." }
    }

    // Check permission (uploader, leader, or admin)
    const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: resource.workspaceId, userId: session.user.id } }
    })

    const canDelete = resource.uploaderId === session.user.id || membership?.isLeader || session.user.isAdmin

    if (!canDelete) {
        return { error: "삭제 권한이 없습니다." }
    }

    try {
        // Delete file from Supabase Storage if it's a FILE type
        if (resource.type === 'FILE' && resource.url) {
            const urlParts = resource.url.split('/storage/v1/object/public/uploads/')
            if (urlParts.length > 1) {
                const filePath = urlParts[1]
                await supabaseAdmin.storage
                    .from(STORAGE_BUCKET)
                    .remove([filePath])
            }
        }

        await prisma.workspaceResource.delete({ where: { id } })

        revalidatePath(`/workspaces/${resource.workspaceId}`)
        return { success: true }
    } catch (error) {
        console.error('Delete error:', error)
        return { error: "삭제 중 오류가 발생했습니다." }
    }
}
