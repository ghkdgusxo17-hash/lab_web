'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

// Get comments for a post
export async function getComments(postId: string) {
    const comments = await prisma.comment.findMany({
        where: { postId },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                }
            }
        },
        orderBy: { createdAt: 'asc' },
    })

    return comments
}

// Create a comment
export async function createComment(postId: string, content: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "로그인이 필요합니다." }
    }

    // Only approved members or admins can comment
    if (!session.user.isAdmin && !session.user.isApproved) {
        return { error: "댓글 작성 권한이 없습니다." }
    }

    if (!content.trim()) {
        return { error: "댓글 내용을 입력하세요." }
    }

    const comment = await prisma.comment.create({
        data: {
            content: content.trim(),
            postId,
            authorId: session.user.id,
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                }
            }
        }
    })

    revalidatePath(`/board/${postId}`)
    return { success: true, comment }
}

// Update a comment
export async function updateComment(commentId: string, content: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "로그인이 필요합니다." }
    }

    const comment = await prisma.comment.findUnique({
        where: { id: commentId }
    })

    if (!comment) {
        return { error: "댓글을 찾을 수 없습니다." }
    }

    // Only author or admin can update
    if (comment.authorId !== session.user.id && !session.user.isAdmin) {
        return { error: "수정 권한이 없습니다." }
    }

    if (!content.trim()) {
        return { error: "댓글 내용을 입력하세요." }
    }

    await prisma.comment.update({
        where: { id: commentId },
        data: { content: content.trim() }
    })

    revalidatePath(`/board/${comment.postId}`)
    return { success: true }
}

// Delete a comment
export async function deleteComment(commentId: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "로그인이 필요합니다." }
    }

    const comment = await prisma.comment.findUnique({
        where: { id: commentId }
    })

    if (!comment) {
        return { error: "댓글을 찾을 수 없습니다." }
    }

    // Only author or admin can delete
    if (comment.authorId !== session.user.id && !session.user.isAdmin) {
        return { error: "삭제 권한이 없습니다." }
    }

    await prisma.comment.delete({
        where: { id: commentId }
    })

    revalidatePath(`/board/${comment.postId}`)
    return { success: true }
}
