import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getTimetables, getMembersWithTimetableStatus } from '@/actions/timetable'
import { NavbarClient } from '@/components/layout/NavbarClient'
import { TimetableClient } from './TimetableClient'

export const dynamic = 'force-dynamic'

export default async function TimetablePage() {
    const session = await auth()
    if (!session?.user) redirect('/api/auth/signin')

    const [timetables, members] = await Promise.all([
        getTimetables(),
        getMembersWithTimetableStatus(),
    ])

    // Date 객체를 직렬화
    const serializedTimetables = timetables.map(t => ({
        ...t,
        updatedAt: t.updatedAt.toISOString(),
        createdAt: t.createdAt.toISOString(),
        entries: t.entries.map(e => ({
            ...e,
            createdAt: e.createdAt.toISOString(),
        })),
    }))

    const serializedMembers = members.map(m => ({
        ...m,
        updatedAt: m.updatedAt ? m.updatedAt.toISOString() : null,
    }))

    return (
        <>
            <NavbarClient session={session} />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <TimetableClient
                        session={session}
                        timetables={serializedTimetables}
                        members={serializedMembers}
                    />
                </div>
            </main>
        </>
    )
}
