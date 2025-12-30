'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { isRateLimited } from '@/lib/rate-limit'

// Submit a contact inquiry (public - no login required)
export async function submitInquiry(formData: FormData) {
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string

    if (!name || !email || !subject || !message) {
        return { error: "모든 필드를 입력해주세요." }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return { error: "유효한 이메일을 입력해주세요." }
    }

    // Rate limiting: 3 submissions per minute per email
    if (isRateLimited(`contact:${email}`, { maxRequests: 3, windowMs: 60 * 1000 })) {
        return { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." }
    }

    await prisma.contactInquiry.create({
        data: {
            name,
            email,
            subject,
            message
        }
    })

    return { success: true }
}

// Get all inquiries (Admin only)
export async function getInquiries() {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    const inquiries = await prisma.contactInquiry.findMany({
        orderBy: { createdAt: 'desc' }
    })

    return { inquiries }
}

// Mark inquiry as read (Admin only)
export async function markInquiryAsRead(id: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    await prisma.contactInquiry.update({
        where: { id },
        data: { isRead: true }
    })

    revalidatePath('/admin')
    return { success: true }
}

// Delete inquiry (Admin only)
export async function deleteInquiry(id: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    await prisma.contactInquiry.delete({
        where: { id }
    })

    revalidatePath('/admin')
    return { success: true }
}

// Get unread count (for badge in admin)
export async function getUnreadInquiryCount() {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return 0
    }

    const count = await prisma.contactInquiry.count({
        where: { isRead: false }
    })

    return count
}
