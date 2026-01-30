import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { LabMeetingForm } from './LabMeetingForm'
import { getApprovedMembers } from '@/actions/lab-meeting'

export const metadata: Metadata = {
    title: '새 랩미팅 | CPE Lab',
    description: 'Create a new lab meeting',
}

export default async function NewLabMeetingPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        redirect('/materials/lab-meeting')
    }

    const members = await getApprovedMembers()

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
                        새 랩미팅 생성
                    </h1>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <LabMeetingForm members={members} />
                    </div>
                </div>
            </main>
        </>
    )
}
