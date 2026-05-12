import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { Plus, ArrowLeft, Users, ChevronRight, Search as SearchIcon } from 'lucide-react'
import { getLabMeetingYearStats, getLabMeetingMonthStats, getLabMeetingsByMonth, searchLabMeetings } from '@/actions/lab-meeting'
import { YearCardList } from './YearCardList'
import { MonthGrid } from './MonthGrid'
import { MeetingList } from './MeetingList'
import { LabMeetingSearch } from './LabMeetingSearch'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Lab Meeting | CPE Lab',
    description: 'Lab Meeting materials and archives',
}

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export default async function LabMeetingPage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string; search?: string }> }) {
    const session = await auth()
    const params = await searchParams
    const year = params.year ? parseInt(params.year) : null
    const month = params.month ? parseInt(params.month) : null
    const search = params.search || ''

    // Determine which view to render
    let viewContent: React.ReactNode
    let breadcrumbItems: { label: string; href?: string }[] = [{ label: 'Lab Meeting', href: '/materials/lab-meeting' }]

    if (search) {
        // Search view
        const results = await searchLabMeetings(search)
        breadcrumbItems.push({ label: `"${search}" 검색 결과` })
        viewContent = (
            <>
                <div className="mb-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        <SearchIcon className="w-4 h-4 inline mr-1" />
                        &quot;{search}&quot; 검색 결과 ({results.length}건)
                    </p>
                </div>
                <MeetingList meetings={results} />
            </>
        )
    } else if (year && month) {
        // Month meetings view
        const meetings = await getLabMeetingsByMonth(year, month)
        breadcrumbItems.push({ label: `${year}년`, href: `/materials/lab-meeting?year=${year}` })
        breadcrumbItems.push({ label: MONTH_NAMES[month - 1] })
        viewContent = <MeetingList meetings={meetings} />
    } else if (year) {
        // Month grid view
        const monthStats = await getLabMeetingMonthStats(year)
        breadcrumbItems.push({ label: `${year}년` })
        viewContent = <MonthGrid year={year} monthStats={monthStats} />
    } else {
        // Year cards view (root)
        const yearStats = await getLabMeetingYearStats()
        viewContent = <YearCardList yearStats={yearStats} />
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <Link
                                href="/materials"
                                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                연구자료
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                                    Lab Meeting
                                </h1>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <LabMeetingSearch currentSearch={search} />
                            {(session?.user?.isApproved || session?.user?.isAdmin) && (
                                <Link
                                    href="/materials/lab-meeting/presenters"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                                >
                                    <Users className="w-4 h-4" />
                                    발표자별 자료
                                </Link>
                            )}
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
                    </div>

                    {/* Board Container */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6">
                            {/* Breadcrumb */}
                            {breadcrumbItems.length > 1 && (
                                <nav className="flex items-center gap-1.5 text-sm mb-6">
                                    {breadcrumbItems.map((item, i) => (
                                        <span key={i} className="flex items-center gap-1.5">
                                            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                            {item.href && i < breadcrumbItems.length - 1 ? (
                                                <Link href={item.href} className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                    {item.label}
                                                </Link>
                                            ) : (
                                                <span className="text-slate-700 dark:text-slate-300 font-medium">{item.label}</span>
                                            )}
                                        </span>
                                    ))}
                                </nav>
                            )}

                            {viewContent}
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
