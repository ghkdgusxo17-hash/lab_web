import { auth } from '@/auth'
import { getCombinedEvents } from '@/actions/event'
import { CalendarClientWithEvents } from './CalendarClientWithEvents'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
    const session = await auth()
    const { dbEvents, googleEvents, connectedMembers } = await getCombinedEvents()

    // Serialize dates for client component
    const serializedEvents = dbEvents.map(event => ({
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
            googleEvents={googleEvents}
            connectedMembers={connectedMembers}
        />
    )
}
