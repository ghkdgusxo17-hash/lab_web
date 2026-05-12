'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import {
    getUserGoogleCalendars,
    hasGoogleCalendarScope,
    type GoogleCalendarInfo,
} from '@/lib/google-calendar'

// ============ Get Connection Status ============

export async function getGoogleCalendarStatus() {
    const session = await auth()
    if (!session?.user?.id) return { connected: false, calendars: [] as GoogleCalendarInfo[] }

    const hasScope = await hasGoogleCalendarScope(session.user.id)
    if (!hasScope) return { connected: false, calendars: [] as GoogleCalendarInfo[] }

    // Get Google calendars list
    const googleCalendars = await getUserGoogleCalendars(session.user.id)

    // Get saved sync configs
    const syncConfigs = await prisma.googleCalendarSync.findMany({
        where: { userId: session.user.id },
    })

    const syncMap = new Map(syncConfigs.map(c => [c.calendarId, c]))

    return {
        connected: true,
        calendars: googleCalendars,
        syncConfigs: syncConfigs.map(c => ({
            calendarId: c.calendarId,
            calendarName: c.calendarName,
            isShared: c.isShared,
            color: c.color,
            category: c.category,
            isImportant: c.isImportant,
        })),
    }
}

// ============ Save Calendar Sync Settings ============

export async function saveCalendarSyncSettings(
    settings: { calendarId: string; calendarName: string; isShared: boolean; color: string | null; category: string; isImportant: boolean }[]
) {
    const session = await auth()
    if (!session?.user?.id) return { error: '로그인이 필요합니다.' }

    const hasScope = await hasGoogleCalendarScope(session.user.id)
    if (!hasScope) return { error: 'Google Calendar 연동이 필요합니다.' }

    // Delete existing configs for this user
    await prisma.googleCalendarSync.deleteMany({
        where: { userId: session.user.id },
    })

    // Create new configs
    if (settings.length > 0) {
        await prisma.googleCalendarSync.createMany({
            data: settings.map(s => ({
                userId: session.user.id,
                calendarId: s.calendarId,
                calendarName: s.calendarName,
                isShared: s.isShared,
                color: s.color,
                category: s.category,
                isImportant: s.isImportant,
            })),
        })
    }

    revalidatePath('/calendar')
    revalidatePath('/settings')
    return { success: true }
}

// ============ Save Google Event Override ============

export async function saveGoogleEventOverride(
    googleEventId: string,
    data: { category?: string | null; isImportant?: boolean | null }
) {
    const session = await auth()
    if (!session?.user?.id) return { error: '로그인이 필요합니다.' }
    if (!session.user.isApproved && !session.user.isAdmin) return { error: '권한이 없습니다.' }

    // Upsert: create or update
    await prisma.googleEventOverride.upsert({
        where: { googleEventId },
        create: {
            googleEventId,
            category: data.category,
            isImportant: data.isImportant,
        },
        update: {
            category: data.category,
            isImportant: data.isImportant,
        },
    })

    revalidatePath('/calendar')
    return { success: true }
}

// ============ Disconnect Google Calendar ============

export async function disconnectGoogleCalendar() {
    const session = await auth()
    if (!session?.user?.id) return { error: '로그인이 필요합니다.' }

    // Delete all sync configs
    await prisma.googleCalendarSync.deleteMany({
        where: { userId: session.user.id },
    })

    revalidatePath('/calendar')
    revalidatePath('/settings')
    return { success: true }
}
