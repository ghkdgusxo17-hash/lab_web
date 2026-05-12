'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { getProxyUrl, extractStoragePath } from '@/lib/storage-constants'
import { removeStoragePaths, uploadStorageObject } from '@/lib/storage-admin'

// Get tasks (with privacy: only author's tasks or all for admin)
export async function getTasks(filters?: { status?: string; category?: string; projectId?: string; userId?: string }) {
    const session = await auth()

    if (!session?.user) {
        return []
    }

    const where: any = {}

    // Privacy: Only author can see their tasks, admin can see all (optionally filtered by userId)
    if (!session.user.isAdmin) {
        where.authorId = session.user.id
    } else if (filters?.userId) {
        // Admin filtering by specific user
        where.authorId = filters.userId
    }

    if (filters?.status && filters.status !== 'ALL') {
        where.status = filters.status
    }

    if (filters?.category && filters.category !== 'ALL') {
        where.category = filters.category
    }

    if (filters?.projectId) {
        where.projectId = filters.projectId
    }

    const tasks = await prisma.task.findMany({
        where,
        include: {
            author: { select: { id: true, name: true, image: true, medalPoints: true } },
            project: { select: { id: true, name: true } },
            _count: { select: { comments: true, attachments: true } }
        },
        orderBy: { updatedAt: 'desc' }
    })

    return tasks
}

// Get single task (with access check)
export async function getTask(id: string) {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    const task = await prisma.task.findUnique({
        where: { id },
        include: {
            author: { select: { id: true, name: true, image: true, medalPoints: true } },
            project: { select: { id: true, name: true } },
            comments: {
                include: {
                    author: { select: { id: true, name: true, image: true } }
                },
                orderBy: { createdAt: 'asc' }
            },
            attachments: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!task) return null

    // Privacy check: only author or admin
    if (task.authorId !== session.user.id && !session.user.isAdmin) {
        return null
    }

    return task
}

// Create task (Approved members only)
export async function createTask(formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "승인된 멤버만 작업을 생성할 수 있습니다." }
    }

    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const category = formData.get('category') as string || 'OTHER'
    const projectId = formData.get('projectId') as string | null

    if (!title || !content) {
        return { error: "제목과 내용을 입력해주세요." }
    }

    const task = await prisma.task.create({
        data: {
            title,
            content,
            category,
            projectId: projectId || null,
            authorId: session.user.id
        }
    })

    revalidatePath('/tasks')
    redirect(`/tasks/${task.id}`)
}

// Update task status
export async function updateTaskStatus(id: string, status: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const task = await prisma.task.findUnique({ where: { id } })

    if (!task) {
        return { error: "작업을 찾을 수 없습니다." }
    }

    // Access check
    if (task.authorId !== session.user.id && !session.user.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    // Status change rules:
    // Author: IN_PROGRESS <-> QUESTION, ANSWERED -> IN_PROGRESS, any -> COMPLETED
    // Admin: All
    const validStatuses = ['IN_PROGRESS', 'QUESTION', 'ANSWERED', 'COMPLETED']
    if (!validStatuses.includes(status)) {
        return { error: "유효하지 않은 상태입니다." }
    }

    // Non-admin restrictions
    if (!session.user.isAdmin) {
        if (status === 'ANSWERED') {
            return { error: "교수님만 답변완료로 변경할 수 있습니다." }
        }
    }

    await prisma.task.update({
        where: { id },
        data: { status }
    })

    revalidatePath('/tasks')
    revalidatePath(`/tasks/${id}`)
    return { success: true }
}

// Add comment
export async function addTaskComment(taskId: string, content: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } })

    if (!task) {
        return { error: "작업을 찾을 수 없습니다." }
    }

    // Access check
    if (task.authorId !== session.user.id && !session.user.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    await prisma.taskComment.create({
        data: {
            content,
            taskId,
            authorId: session.user.id
        }
    })

    revalidatePath(`/tasks/${taskId}`)
    return { success: true }
}

// Upload attachment
export async function uploadTaskAttachment(taskId: string, formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } })

    if (!task) {
        return { error: "작업을 찾을 수 없습니다." }
    }

    // Access check
    if (task.authorId !== session.user.id && !session.user.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    const file = formData.get('file') as File

    if (!file) {
        return { error: "파일을 선택해주세요." }
    }

    try {
        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filename = `${timestamp}_${safeName}`
        const filePath = `task-attachments/${filename}`

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const { error: uploadError } = await uploadStorageObject(filePath, buffer, {
            contentType: file.type,
            upsert: true,
        })

        if (uploadError) {
            console.error('Supabase upload error:', uploadError)
            return { error: "파일 업로드 중 오류가 발생했습니다." }
        }

        await prisma.taskAttachment.create({
            data: {
                filename: file.name,
                url: getProxyUrl(filePath),
                size: file.size,
                mimeType: file.type,
                taskId
            }
        })

        revalidatePath(`/tasks/${taskId}`)
        return { success: true }
    } catch (error) {
        console.error('Upload error:', error)
        return { error: "파일 업로드 중 오류가 발생했습니다." }
    }
}

// Delete attachment
export async function deleteTaskAttachment(id: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const attachment = await prisma.taskAttachment.findUnique({
        where: { id },
        include: { task: true }
    })

    if (!attachment) {
        return { error: "첨부파일을 찾을 수 없습니다." }
    }

    // Access check
    if (attachment.task.authorId !== session.user.id && !session.user.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    try {
        // Delete from Supabase Storage
        const storagePath = extractStoragePath(attachment.url)
        if (storagePath) {
            await removeStoragePaths([storagePath])
        }

        await prisma.taskAttachment.delete({ where: { id } })

        revalidatePath(`/tasks/${attachment.taskId}`)
        return { success: true }
    } catch (error) {
        console.error('Delete error:', error)
        return { error: "삭제 중 오류가 발생했습니다." }
    }
}

// Delete task
export async function deleteTask(id: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const task = await prisma.task.findUnique({
        where: { id },
        include: { attachments: true }
    })

    if (!task) {
        return { error: "작업을 찾을 수 없습니다." }
    }

    // Only author or admin
    if (task.authorId !== session.user.id && !session.user.isAdmin) {
        return { error: "삭제 권한이 없습니다." }
    }

    try {
        // Delete attachment files from Supabase Storage
        await removeStoragePaths(
            task.attachments
                .map((att) => extractStoragePath(att.url))
                .filter((value): value is string => Boolean(value))
        )

        await prisma.task.delete({ where: { id } })

        revalidatePath('/tasks')
        redirect('/tasks')
    } catch (error) {
        console.error('Delete error:', error)
        return { error: "삭제 중 오류가 발생했습니다." }
    }
}

