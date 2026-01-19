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

// Get single post with comments, attachments, and poll
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
            attachments: true,
            poll: {
                include: {
                    options: {
                        orderBy: { order: 'asc' }
                    }
                }
            }
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
    const type = (formData.get("type") as string) || "FREE"

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

    // Parse poll data
    const pollJson = formData.get("poll") as string
    let pollData: {
        question: string
        options: string[]
        isMultiple: boolean
        isAnonymous: boolean
        endsAt?: string
    } | null = null
    try {
        if (pollJson) {
            pollData = JSON.parse(pollJson)
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
            } : undefined,
            poll: pollData && pollData.options.length >= 2 ? {
                create: {
                    question: pollData.question,
                    isMultiple: pollData.isMultiple,
                    isAnonymous: pollData.isAnonymous,
                    endsAt: pollData.endsAt ? new Date(pollData.endsAt) : null,
                    options: {
                        create: pollData.options.map((text, index) => ({
                            text,
                            order: index
                        }))
                    }
                }
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
        where: { id },
        include: { poll: true }
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

    // Parse removed attachment IDs
    const removedAttachmentIdsJson = formData.get("removedAttachmentIds") as string
    let removedAttachmentIds: string[] = []
    try {
        if (removedAttachmentIdsJson) {
            removedAttachmentIds = JSON.parse(removedAttachmentIdsJson)
        }
    } catch {
        // Ignore parse errors
    }

    // Parse new attachments
    const newAttachmentsJson = formData.get("newAttachments") as string
    let newAttachments: { filename: string; url: string; size: number; mimeType: string }[] = []
    try {
        if (newAttachmentsJson) {
            newAttachments = JSON.parse(newAttachmentsJson)
        }
    } catch {
        // Ignore parse errors
    }

    // Parse poll data
    const deletePoll = formData.get("deletePoll") === "true"
    const pollJson = formData.get("poll") as string
    let pollData: {
        question: string
        options: string[]
        isMultiple: boolean
        isAnonymous: boolean
        endsAt?: string
    } | null = null
    try {
        if (pollJson) {
            pollData = JSON.parse(pollJson)
        }
    } catch {
        // Ignore parse errors
    }

    // Delete removed attachments
    if (removedAttachmentIds.length > 0) {
        await prisma.attachment.deleteMany({
            where: {
                id: { in: removedAttachmentIds },
                postId: id
            }
        })
    }

    // Add new attachments
    if (newAttachments.length > 0) {
        await prisma.attachment.createMany({
            data: newAttachments.map(file => ({
                filename: file.filename,
                url: file.url,
                size: file.size,
                mimeType: file.mimeType,
                postId: id
            }))
        })
    }

    // Handle poll updates
    if (deletePoll && post.poll) {
        // Delete existing poll (cascade will delete options and votes)
        await prisma.poll.delete({
            where: { id: post.poll.id }
        })
    } else if (pollData && pollData.options.length >= 2) {
        if (post.poll) {
            // Delete existing poll and create new one (to reset votes)
            await prisma.poll.delete({
                where: { id: post.poll.id }
            })
        }
        // Create new poll
        await prisma.poll.create({
            data: {
                postId: id,
                question: pollData.question,
                isMultiple: pollData.isMultiple,
                isAnonymous: pollData.isAnonymous,
                endsAt: pollData.endsAt ? new Date(pollData.endsAt) : null,
                options: {
                    create: pollData.options.map((text, index) => ({
                        text,
                        order: index
                    }))
                }
            }
        })
    }

    // Update post basic info
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
