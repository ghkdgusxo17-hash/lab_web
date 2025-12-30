'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Get all posts
export async function getPosts(type?: string) {
    const where = type ? { type } : {}

    const posts = await prisma.post.findMany({
        where,
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                }
            }
        },
        orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' }
        ]
    })

    return posts
}

// Get single post with comments and attachments
export async function getPost(id: string) {
    const post = await prisma.post.findUnique({
        where: { id },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                }
            },
            comments: {
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        }
                    }
                },
                orderBy: { createdAt: 'asc' }
            },
            attachments: true
        }
    })

    return post
}

// Create post
export async function createPost(formData: FormData) {
    const session = await auth()

    if (!session?.user?.id) {
        return { error: "로그인이 필요합니다." }
    }

    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const type = formData.get("type") as string

    if (!title || !content) {
        return { error: "제목과 내용을 입력해주세요." }
    }

    // Check permissions
    if (type === "NOTICE" && !session.user.isAdmin) {
        return { error: "공지사항은 관리자만 작성할 수 있습니다." }
    }

    if ((type === "FREE" || type === "SEMINAR") && !session.user.isApproved && !session.user.isAdmin) {
        return { error: "승인된 회원만 작성할 수 있습니다." }
    }

    // Parse attachments
    const attachmentsJson = formData.get("attachments") as string
    let attachments: { filename: string; url: string; size: number; mimeType: string }[] = []
    try {
        if (attachmentsJson) {
            attachments = JSON.parse(attachmentsJson)
        }
    } catch {
        // Ignore parse errors
    }

    const userId = session.user.id

    const post = await prisma.post.create({
        data: {
            title,
            content,
            type,
            author: {
                connect: { id: userId }
            },
            attachments: attachments.length > 0 ? {
                create: attachments.map(file => ({
                    filename: file.filename,
                    url: file.url,
                    size: file.size,
                    mimeType: file.mimeType,
                }))
            } : undefined
        }
    })

    revalidatePath("/board")
    redirect(`/board/${post.id}`)
}

// Update post
export async function updatePost(id: string, formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const post = await prisma.post.findUnique({
        where: { id }
    })

    if (!post) {
        return { error: "게시글을 찾을 수 없습니다." }
    }

    // Only author or admin can edit
    if (post.authorId !== session.user.id && !session.user.isAdmin) {
        return { error: "수정 권한이 없습니다." }
    }

    const title = formData.get("title") as string
    const content = formData.get("content") as string

    if (!title || !content) {
        return { error: "제목과 내용을 입력해주세요." }
    }

    await prisma.post.update({
        where: { id },
        data: { title, content }
    })

    revalidatePath("/board")
    revalidatePath(`/board/${id}`)
    redirect(`/board/${id}`)
}

// Delete post
export async function deletePost(id: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const post = await prisma.post.findUnique({
        where: { id }
    })

    if (!post) {
        return { error: "게시글을 찾을 수 없습니다." }
    }

    // Only author or admin can delete
    if (post.authorId !== session.user.id && !session.user.isAdmin) {
        return { error: "삭제 권한이 없습니다." }
    }

    await prisma.post.delete({
        where: { id }
    })

    revalidatePath("/board")
    redirect("/board")
}

// Toggle pin (Admin only)
export async function togglePostPin(id: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    const post = await prisma.post.findUnique({
        where: { id }
    })

    if (!post) {
        return { error: "게시글을 찾을 수 없습니다." }
    }

    await prisma.post.update({
        where: { id },
        data: { isPinned: !post.isPinned }
    })

    revalidatePath("/board")
    revalidatePath(`/board/${id}`)
    return { success: true }
}
