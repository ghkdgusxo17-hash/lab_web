import { Session } from 'next-auth'
import { auth } from '@/auth'
import { getEvents } from '@/actions/event'
import { CalendarClientWithEvents } from './CalendarClientWithEvents'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
    const session = await auth()
    const events = await getEvents()

    // Serialize dates for client component
    const serializedEvents = events.map(event => ({
        ...event,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
    }))

    return (
        <CalendarClientWithEvents
            session={session}
            events={serializedEvents}
        />
    )
}
