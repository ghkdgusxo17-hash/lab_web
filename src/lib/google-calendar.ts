import { google } from 'googleapis'
import { prisma } from './prisma'

// ============ OAuth2 Client ============

function createOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
    )
}

// ============ Token Management ============

/**
 * Get a valid access token, refreshing if expired.
 * Returns null if refresh fails or no tokens available.
 */
async function getValidAccessToken(account: {
    id: string
    access_token: string | null
    refresh_token: string | null
    expires_at: number | null
}): Promise<string | null> {
    const now = Math.floor(Date.now() / 1000)

    // Token still valid (with 5 min buffer)
    if (account.access_token && account.expires_at && account.expires_at > now + 300) {
        return account.access_token
    }

    // Need refresh
    if (!account.refresh_token) return null

    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({ refresh_token: account.refresh_token })

    try {
        const { credentials } = await oauth2Client.refreshAccessToken()

        // Update tokens in DB
        await prisma.account.update({
            where: { id: account.id },
            data: {
                access_token: credentials.access_token,
                expires_at: credentials.expiry_date
                    ? Math.floor(credentials.expiry_date / 1000)
                    : null,
            },
        })

        return credentials.access_token || null
    } catch (error) {
        console.error('[Google Calendar] Token refresh failed:', error)
        return null
    }
}

// ============ Account Lookup ============

/**
 * Find a Google account with calendar scope for a user.
 * Checks both 'google' (OAuth login) and 'google-calendar' (separate connection) providers.
 */
async function findCalendarAccount(userId: string) {
    // First check google provider with calendar scope
    const googleAccount = await prisma.account.findFirst({
        where: { userId, provider: 'google' },
    })

    if (googleAccount?.scope?.includes('calendar.readonly')) {
        return googleAccount
    }

    // Then check separate google-calendar provider
    const calendarAccount = await prisma.account.findFirst({
        where: { userId, provider: 'google-calendar' },
    })

    if (calendarAccount) {
        return calendarAccount
    }

    return null
}

// ============ Calendar List ============

export interface GoogleCalendarInfo {
    id: string
    summary: string      // Calendar name
    description?: string
    backgroundColor?: string
    primary?: boolean
}

/**
 * Get list of Google Calendars for a user.
 * Returns empty array if user has no Google account or calendar scope.
 */
export async function getUserGoogleCalendars(userId: string): Promise<GoogleCalendarInfo[]> {
    const account = await findCalendarAccount(userId)
    if (!account) return []

    const accessToken = await getValidAccessToken(account)
    if (!accessToken) return []

    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({ access_token: accessToken })

    const calendarClient = google.calendar({ version: 'v3', auth: oauth2Client })

    try {
        const res = await calendarClient.calendarList.list()
        return (res.data.items || []).map(item => ({
            id: item.id!,
            summary: item.summary || '(이름 없음)',
            description: item.description || undefined,
            backgroundColor: item.backgroundColor || undefined,
            primary: item.primary || false,
        }))
    } catch (error) {
        console.error('[Google Calendar] Failed to fetch calendar list:', error)
        return []
    }
}

// ============ Calendar Events ============

export interface GoogleCalendarEvent {
    id: string
    title: string
    description: string | null
    startTime: string   // ISO string
    endTime: string     // ISO string
    isAllDay: boolean
    isImportant: boolean
    category: string
    source: 'google'
    googleCalendarId: string
    owner: {
        id: string
        name: string | null
        image: string | null
    }
    color: string | null
}

/**
 * Fetch events from specific Google calendars for a user.
 */
async function fetchGoogleEvents(
    userId: string,
    calendarIds: string[],
    startDate: Date,
    endDate: Date
): Promise<GoogleCalendarEvent[]> {
    const account = await findCalendarAccount(userId)
    if (!account) return []

    const accessToken = await getValidAccessToken(account)
    if (!accessToken) return []

    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({ access_token: accessToken })

    const calendarClient = google.calendar({ version: 'v3', auth: oauth2Client })

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, image: true },
    })

    if (!user) return []

    const allEvents: GoogleCalendarEvent[] = []

    // Fetch events from each calendar in parallel
    const results = await Promise.allSettled(
        calendarIds.map(async (calendarId) => {
            const res = await calendarClient.events.list({
                calendarId,
                timeMin: startDate.toISOString(),
                timeMax: endDate.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
                maxResults: 250,
            })

            return (res.data.items || []).map(item => {
                const isAllDay = !item.start?.dateTime
                const startTime = item.start?.dateTime || `${item.start?.date}T00:00:00`
                const endTime = item.end?.dateTime || `${item.end?.date}T23:59:59`

                return {
                    id: `google_${calendarId}_${item.id}`,
                    title: item.summary || '(제목 없음)',
                    description: item.description || null,
                    startTime,
                    endTime,
                    isAllDay,
                    isImportant: false, // Will be set from GoogleCalendarSync
                    category: 'OTHER',  // Will be set from GoogleCalendarSync
                    source: 'google' as const,
                    googleCalendarId: calendarId,
                    owner: user,
                    color: null, // Will be set from GoogleCalendarSync.color
                }
            })
        })
    )

    for (const result of results) {
        if (result.status === 'fulfilled') {
            allEvents.push(...result.value)
        }
    }

    return allEvents
}

/**
 * Get all shared Google Calendar events from all connected members.
 * Only includes events from calendars marked as isShared=true.
 */
export async function getSharedGoogleCalendarEvents(
    startDate: Date,
    endDate: Date
): Promise<GoogleCalendarEvent[]> {
    // Get all shared calendar configs
    const sharedConfigs = await prisma.googleCalendarSync.findMany({
        where: { isShared: true },
        include: {
            user: {
                select: { id: true, name: true, image: true },
            },
        },
    })

    if (sharedConfigs.length === 0) return []

    // Group by userId with full config info
    const userCalendarMap = new Map<string, {
        calendarIds: string[]
        configMap: Map<string, { color: string | null, category: string, isImportant: boolean }>
    }>()
    for (const config of sharedConfigs) {
        if (!userCalendarMap.has(config.userId)) {
            userCalendarMap.set(config.userId, { calendarIds: [], configMap: new Map() })
        }
        const entry = userCalendarMap.get(config.userId)!
        entry.calendarIds.push(config.calendarId)
        entry.configMap.set(config.calendarId, {
            color: config.color,
            category: config.category,
            isImportant: config.isImportant,
        })
    }

    // Fetch events for each user in parallel
    const results = await Promise.allSettled(
        Array.from(userCalendarMap.entries()).map(async ([userId, { calendarIds, configMap }]) => {
            const events = await fetchGoogleEvents(userId, calendarIds, startDate, endDate)
            // Apply saved config (color, category, isImportant)
            return events.map(event => {
                const cfg = configMap.get(event.googleCalendarId)
                return {
                    ...event,
                    color: cfg?.color || event.color,
                    category: cfg?.category || 'OTHER',
                    isImportant: cfg?.isImportant || false,
                }
            })
        })
    )

    const allEvents: GoogleCalendarEvent[] = []
    for (const result of results) {
        if (result.status === 'fulfilled') {
            allEvents.push(...result.value)
        }
    }

    // Apply individual event overrides (priority: override > calendar config)
    return applyEventOverrides(allEvents)
}

/**
 * Get a specific user's Google Calendar events (for personal calendar view).
 */
export async function getUserGoogleCalendarEvents(
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<GoogleCalendarEvent[]> {
    // Get user's calendar configs (all of them, not just shared)
    const configs = await prisma.googleCalendarSync.findMany({
        where: { userId },
    })

    if (configs.length === 0) return []

    const calendarIds = configs.map(c => c.calendarId)
    const configMap = new Map(configs.map(c => [c.calendarId, { color: c.color, category: c.category, isImportant: c.isImportant }]))

    const events = await fetchGoogleEvents(userId, calendarIds, startDate, endDate)

    const mapped = events.map(event => {
        const cfg = configMap.get(event.googleCalendarId)
        return {
            ...event,
            color: cfg?.color || event.color,
            category: cfg?.category || 'OTHER',
            isImportant: cfg?.isImportant || false,
        }
    })

    // Apply individual event overrides (priority: override > calendar config)
    return applyEventOverrides(mapped)
}

/**
 * Apply individual event overrides from GoogleEventOverride table.
 * Override values take priority over calendar-level config.
 * null values in override mean "use calendar-level default" (already applied).
 */
async function applyEventOverrides(events: GoogleCalendarEvent[]): Promise<GoogleCalendarEvent[]> {
    if (events.length === 0) return events

    const eventIds = events.map(e => e.id)
    const overrides = await prisma.googleEventOverride.findMany({
        where: { googleEventId: { in: eventIds } },
    })

    if (overrides.length === 0) return events

    const overrideMap = new Map(overrides.map(o => [o.googleEventId, o]))

    return events.map(event => {
        const override = overrideMap.get(event.id)
        if (!override) return event
        return {
            ...event,
            category: override.category ?? event.category,
            isImportant: override.isImportant ?? event.isImportant,
        }
    })
}

/**
 * Check if a user has Google Calendar connected (has calendar scope).
 */
export async function hasGoogleCalendarScope(userId: string): Promise<boolean> {
    const account = await findCalendarAccount(userId)
    return !!account
}

/**
 * Get connected members info (who has Google Calendar linked and shared).
 */
export async function getConnectedMembers(): Promise<{
    id: string
    name: string | null
    image: string | null
    sharedCalendarCount: number
}[]> {
    const configs = await prisma.googleCalendarSync.findMany({
        where: { isShared: true },
        include: {
            user: {
                select: { id: true, name: true, image: true },
            },
        },
    })

    // Group by user
    const userMap = new Map<string, { user: { id: string, name: string | null, image: string | null }, count: number }>()
    for (const config of configs) {
        if (!userMap.has(config.userId)) {
            userMap.set(config.userId, { user: config.user, count: 0 })
        }
        userMap.get(config.userId)!.count++
    }

    return Array.from(userMap.values()).map(({ user, count }) => ({
        ...user,
        sharedCalendarCount: count,
    }))
}
