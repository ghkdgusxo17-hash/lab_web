'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// Get reservations for a resource (with optional date range)
export async function getReservations(resourceId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {}

    if (resourceId) {
        where.resourceId = resourceId
    }

    if (startDate && endDate) {
        where.startTime = {
            gte: startDate,
            lt: endDate
        }
    }

    const reservations = await prisma.reservation.findMany({
        where,
        include: {
            resource: { select: { id: true, name: true } },
            user: { select: { id: true, name: true, image: true } }
        },
        orderBy: { startTime: 'asc' }
    })

    return reservations
}

// Get today's reservations
export async function getTodayReservations() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return getReservations(undefined, today, tomorrow)
}

// Get week's reservations for a resource
export async function getWeekReservations(resourceId: string, weekStart: Date) {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    return getReservations(resourceId, weekStart, weekEnd)
}

// Check for reservation conflict
async function checkConflict(resourceId: string, startTime: Date, endTime: Date, excludeId?: string) {
    const where: any = {
        resourceId,
        OR: [
            // New reservation starts during existing
            { startTime: { lte: startTime }, endTime: { gt: startTime } },
            // New reservation ends during existing
            { startTime: { lt: endTime }, endTime: { gte: endTime } },
            // New reservation contains existing
            { startTime: { gte: startTime }, endTime: { lte: endTime } }
        ]
    }

    if (excludeId) {
        where.id = { not: excludeId }
    }

    const conflict = await prisma.reservation.findFirst({ where })
    return conflict !== null
}

// Create reservation (Approved members only)
export async function createReservation(formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "승인된 멤버만 예약할 수 있습니다." }
    }

    const resourceId = formData.get('resourceId') as string
    const date = formData.get('date') as string // YYYY-MM-DD
    const startHour = parseInt(formData.get('startHour') as string)
    const endHour = parseInt(formData.get('endHour') as string)
    const purpose = formData.get('purpose') as string

    if (!resourceId || !date || isNaN(startHour) || isNaN(endHour)) {
        return { error: "필수 정보를 입력해주세요." }
    }

    if (startHour >= endHour) {
        return { error: "종료 시간은 시작 시간보다 커야 합니다." }
    }

    if (startHour < 0 || startHour > 23 || endHour < 1 || endHour > 24) {
        return { error: "유효하지 않은 시간입니다." }
    }

    // Check resource exists and is available
    const resource = await prisma.resource.findUnique({ where: { id: resourceId } })
    if (!resource) {
        return { error: "자원을 찾을 수 없습니다." }
    }
    if (!resource.isAvailable) {
        return { error: "현재 예약할 수 없는 자원입니다." }
    }

    // Create start and end times
    const startTime = new Date(`${date}T${startHour.toString().padStart(2, '0')}:00:00`)
    const endTime = new Date(`${date}T${endHour.toString().padStart(2, '0')}:00:00`)

    // Check for conflicts
    const hasConflict = await checkConflict(resourceId, startTime, endTime)
    if (hasConflict) {
        return { error: "해당 시간대에 이미 예약이 있습니다." }
    }

    // Create reservation (auto-approved)
    await prisma.reservation.create({
        data: {
            resourceId,
            userId: session.user.id,
            startTime,
            endTime,
            status: 'APPROVED',
            purpose: purpose || null
        }
    })

    revalidatePath('/reservations')
    revalidatePath(`/reservations/${resourceId}`)
    return { success: true }
}

// Cancel reservation (own or admin)
export async function cancelReservation(id: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const reservation = await prisma.reservation.findUnique({ where: { id } })

    if (!reservation) {
        return { error: "예약을 찾을 수 없습니다." }
    }

    // Only owner or admin can cancel
    if (reservation.userId !== session.user.id && !session.user.isAdmin) {
        return { error: "취소 권한이 없습니다." }
    }

    await prisma.reservation.delete({ where: { id } })

    revalidatePath('/reservations')
    revalidatePath(`/reservations/${reservation.resourceId}`)
    return { success: true }
}

// Get my reservations
export async function getMyReservations() {
    const session = await auth()

    if (!session?.user) {
        return []
    }

    const reservations = await prisma.reservation.findMany({
        where: { userId: session.user.id },
        include: {
            resource: { select: { id: true, name: true } }
        },
        orderBy: { startTime: 'desc' }
    })

    return reservations
}
