'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { EVENT_CATEGORIES } from "@/lib/event-categories"

// Get all events
export async function getEvents() {
    const events = await prisma.calendarEvent.findMany({
        include: {
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                }
            }
        },
        orderBy: { startTime: 'asc' },
    })

    return events
}

// Get events for a specific month
export async function getEventsByMonth(year: number, month: number) {
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)

    const events = await prisma.calendarEvent.findMany({
        where: {
            OR: [
                {
                    startTime: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    }
                },
                {
                    endTime: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    }
                }
            ]
        },
        include: {
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                }
            }
        },
        orderBy: { startTime: 'asc' },
    })

    return events
}

// Get single event
export async function getEvent(id: string) {
    const event = await prisma.calendarEvent.findUnique({
        where: { id },
        include: {
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                }
            }
        }
    })

    return event
}

// Create event
export async function createEvent(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "로그인이 필요합니다." }
    }

    // Only approved members or admins can create events
    if (!session.user.isAdmin && !session.user.isApproved) {
        return { error: "일정 추가 권한이 없습니다." }
    }

    const title = formData.get("title") as string
    const description = formData.get("description") as string || null
    const category = formData.get("category") as string || "OTHER"
    const isAllDay = formData.get("isAllDay") === "true"
    const startDate = formData.get("startDate") as string
    const startTime = formData.get("startTime") as string
    const endDate = formData.get("endDate") as string
    const endTime = formData.get("endTime") as string

    if (!title || !startDate) {
        return { error: "제목과 시작 날짜는 필수입니다." }
    }

    // Construct datetime
    let startDateTime: Date
    let endDateTime: Date

    if (isAllDay) {
        startDateTime = new Date(`${startDate}T00:00:00`)
        endDateTime = endDate ? new Date(`${endDate}T23:59:59`) : new Date(`${startDate}T23:59:59`)
    } else {
        startDateTime = new Date(`${startDate}T${startTime || '09:00'}`)
        endDateTime = endDate
            ? new Date(`${endDate}T${endTime || '10:00'}`)
            : new Date(`${startDate}T${endTime || '10:00'}`)
    }

    // Get color from category
    const color = EVENT_CATEGORIES[category as keyof typeof EVENT_CATEGORIES]?.color || EVENT_CATEGORIES.OTHER.color

    const event = await prisma.calendarEvent.create({
        data: {
            title,
            description,
            category,
            startTime: startDateTime,
            endTime: endDateTime,
            isAllDay,
            color,
            createdById: session.user.id,
        }
    })

    revalidatePath("/calendar")
    return { success: true, eventId: event.id }
}

// Update event
export async function updateEvent(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "로그인이 필요합니다." }
    }

    const event = await prisma.calendarEvent.findUnique({
        where: { id }
    })

    if (!event) {
        return { error: "일정을 찾을 수 없습니다." }
    }

    // Only creator or admin can update
    if (event.createdById !== session.user.id && !session.user.isAdmin) {
        return { error: "수정 권한이 없습니다." }
    }

    const title = formData.get("title") as string
    const description = formData.get("description") as string || null
    const category = formData.get("category") as string || "OTHER"
    const isAllDay = formData.get("isAllDay") === "true"
    const startDate = formData.get("startDate") as string
    const startTime = formData.get("startTime") as string
    const endDate = formData.get("endDate") as string
    const endTime = formData.get("endTime") as string

    if (!title || !startDate) {
        return { error: "제목과 시작 날짜는 필수입니다." }
    }

    // Construct datetime
    let startDateTime: Date
    let endDateTime: Date

    if (isAllDay) {
        startDateTime = new Date(`${startDate}T00:00:00`)
        endDateTime = endDate ? new Date(`${endDate}T23:59:59`) : new Date(`${startDate}T23:59:59`)
    } else {
        startDateTime = new Date(`${startDate}T${startTime || '09:00'}`)
        endDateTime = endDate
            ? new Date(`${endDate}T${endTime || '10:00'}`)
            : new Date(`${startDate}T${endTime || '10:00'}`)
    }

    const color = EVENT_CATEGORIES[category as keyof typeof EVENT_CATEGORIES]?.color || EVENT_CATEGORIES.OTHER.color

    await prisma.calendarEvent.update({
        where: { id },
        data: {
            title,
            description,
            category,
            startTime: startDateTime,
            endTime: endDateTime,
            isAllDay,
            color,
        }
    })

    revalidatePath("/calendar")
    return { success: true }
}

// Delete event
export async function deleteEvent(id: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "로그인이 필요합니다." }
    }

    const event = await prisma.calendarEvent.findUnique({
        where: { id }
    })

    if (!event) {
        return { error: "일정을 찾을 수 없습니다." }
    }

    // Only creator or admin can delete
    if (event.createdById !== session.user.id && !session.user.isAdmin) {
        return { error: "삭제 권한이 없습니다." }
    }

    await prisma.calendarEvent.delete({
        where: { id }
    })

    revalidatePath("/calendar")
    return { success: true }
}
