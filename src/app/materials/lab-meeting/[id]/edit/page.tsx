import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { ArrowLeft } from 'lucide-react'
import { getLabMeeting, getApprovedMembers } from '@/actions/lab-meeting'
import { EditLabMeetingForm } from './EditLabMeetingForm'

export const metadata: Metadata = {
    title: '랩미팅 수정 | CPE Lab',
    description: 'Edit lab meeting',
}

export default async function EditLabMeetingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        redirect('/materials/lab-meeting')
    }

    const meeting = await getLabMeeting(id)

    if (!meeting) {
        notFound()
    }

    const members = await getApprovedMembers()

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-2xl mx-auto">
                    <Link
                        href={`/materials/lab-meeting/${id}`}
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        돌아가기
                    </Link>

                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
                        랩미팅 수정
                    </h1>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <EditLabMeetingForm meeting={meeting} members={members} />
                    </div>
                </div>
            </main>
        </>
    )
}
