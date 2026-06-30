'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// Get all active announcements
export async function getActiveAnnouncements() {
    if (!process.env.REAL_DATABASE_URL) {
        return []
    }

    const now = new Date()

    const announcements = await prisma.announcement.findMany({
        where: {
            isActive: true,
            startDate: { lte: now },
            OR: [
                { endDate: null },
                { endDate: { gte: now } }
            ]
        },
        orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
        ]
    })

    return announcements
}

// Get all announcements (for admin)
export async function getAllAnnouncements() {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    const announcements = await prisma.announcement.findMany({
        orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
        ]
    })

    return { announcements }
}

// Create announcement (Admin only)
export async function createAnnouncement(formData: FormData) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const priority = parseInt(formData.get('priority') as string) || 0
    const endDateStr = formData.get('endDate') as string
    const recipientIdsJson = formData.get('recipientIds') as string

    if (!title || !content) {
        return { error: "제목과 내용을 입력해주세요." }
    }

    const announcement = await prisma.announcement.create({
        data: {
            title,
            content,
            priority,
            endDate: endDateStr ? new Date(endDateStr) : null
        }
    })

    // Handle Email Notifications
    if (recipientIdsJson) {
        try {
            const recipientIds = JSON.parse(recipientIdsJson) as string[]
            if (recipientIds.length > 0) {
                // Fetch emails
                const recipients = await prisma.user.findMany({
                    where: {
                        id: { in: recipientIds },
                        email: { not: null }
                    },
                    select: { email: true, name: true }
                })

                const emails = recipients.map(u => u.email).filter(e => e) as string[]

                if (emails.length > 0) {
                    const { sendEmail } = await import('@/lib/email')

                    await sendEmail({
                        to: emails,
                        subject: `[연구실 공지] ${title}`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                                <h2 style="color: #2563eb;">📢 새로운 공지사항</h2>
                                <h3 style="margin-top: 20px;">${title}</h3>
                                <p style="white-space: pre-wrap; color: #4b5563; line-height: 1.6;">${content}</p>
                                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                                    <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                        연구실 홈페이지 바로가기
                                    </a>
                                </div>
                            </div>
                        `
                    })
                }
            }
        } catch (error) {
            console.error('Failed to send announcement emails:', error)
            // Do not fail the announcement creation
        }
    }

    revalidatePath('/admin')
    revalidatePath('/')
    return { success: true }
}

// Update announcement (Admin only)
export async function updateAnnouncement(id: string, formData: FormData) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const priority = parseInt(formData.get('priority') as string) || 0
    const isActive = formData.get('isActive') === 'true'
    const endDateStr = formData.get('endDate') as string

    await prisma.announcement.update({
        where: { id },
        data: {
            title,
            content,
            priority,
            isActive,
            endDate: endDateStr ? new Date(endDateStr) : null
        }
    })

    revalidatePath('/admin')
    revalidatePath('/')
    return { success: true }
}

// Delete announcement (Admin only)
export async function deleteAnnouncement(id: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    await prisma.announcement.delete({
        where: { id }
    })

    revalidatePath('/admin')
    revalidatePath('/')
    return { success: true }
}

// Toggle announcement active status (Admin only)
export async function toggleAnnouncementActive(id: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    const announcement = await prisma.announcement.findUnique({
        where: { id }
    })

    if (!announcement) {
        return { error: "공지를 찾을 수 없습니다." }
    }

    await prisma.announcement.update({
        where: { id },
        data: { isActive: !announcement.isActive }
    })

    revalidatePath('/admin')
    revalidatePath('/')
    return { success: true }
}
