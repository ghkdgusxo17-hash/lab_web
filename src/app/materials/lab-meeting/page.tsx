import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { Calendar, Plus } from 'lucide-react'
import { getLabMeetings } from '@/actions/lab-meeting'
import { MaterialTabs } from '@/components/materials/MaterialTabs'
import { MonthlyAccordion } from './MonthlyAccordion'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Lab Meeting | CPE Lab',
    description: 'Lab Meeting materials and archives',
}

export default async function LabMeetingPage() {
    const session = await auth()
    const meetings = await getLabMeetings()

    // Group meetings by year-month
    const groupedMeetings = meetings.reduce((acc, meeting) => {
        const date = new Date(meeting.date)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!acc[key]) {
            acc[key] = []
        }
        acc[key].push(meeting)
        return acc
    }, {} as Record<string, typeof meetings>)

    const sortedKeys = Object.keys(groupedMeetings).sort((a, b) => b.localeCompare(a))

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                연구자료
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                연구에 필요한 자료를 공유합니다
                            </p>
                        </div>
                    </div>

                    {/* Board Container */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Tabs */}
                        <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pr-4">
                            <MaterialTabs
                                currentCategory=""
                                currentUserId=""
                                currentSearch=""
                                isLabMeetingActive={true}
                            />
                        </div>

                        {/* Content Area */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                                        Lab Meeting
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                                        날짜별 랩미팅 자료 아카이브
                                    </p>
                                </div>
                                {(session?.user?.isApproved || session?.user?.isAdmin) && (
                                    <Link
                                        href="/materials/lab-meeting/new"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        새 랩미팅
                                    </Link>
                                )}
                            </div>

                            {meetings.length === 0 ? (
                                <div className="text-center py-20">
                                    <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                        등록된 랩미팅이 없습니다
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 mb-8">
                                        새 랩미팅을 생성하여 자료를 관리해보세요
                                    </p>
                                </div>
                            ) : (
                                <MonthlyAccordion
                                    groupedMeetings={groupedMeetings}
                                    sortedKeys={sortedKeys}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
