import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getTimetable } from '@/actions/timetable'
import { NavbarClient } from '@/components/layout/NavbarClient'
import { TimetableEditorClient } from './TimetableEditorClient'

export const dynamic = 'force-dynamic'

export default async function TimetableEditPage() {
    const session = await auth()
    if (!session?.user) redirect('/api/auth/signin')

    const timetable = await getTimetable(session.user.id!)

    const serializedEntries = timetable?.entries.map(e => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
    })) || []

    return (
        <>
            <NavbarClient session={session} />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <TimetableEditorClient
                        session={session}
                        existingEntries={serializedEntries}
                        semester={timetable?.semester || ''}
                    />
                </div>
            </main>
        </>
    )
}
