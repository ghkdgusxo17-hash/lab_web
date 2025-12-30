import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getResource } from '@/actions/resource'
import { getWeekReservations } from '@/actions/reservation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { ArrowLeft, Server, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { WeeklyCalendar } from './WeeklyCalendar'
import { ReservationForm } from './ReservationForm'

export async function generateMetadata({ params }: { params: Promise<{ resourceId: string }> }): Promise<Metadata> {
    const { resourceId } = await params
    const resource = await getResource(resourceId)
    return {
        title: resource ? `${resource.name} 예약 | CPE Lab` : '예약',
    }
}

interface ResourceDetailPageProps {
    params: Promise<{ resourceId: string }>
    searchParams: Promise<{ week?: string }>
}

export default async function ResourceDetailPage({ params, searchParams }: ResourceDetailPageProps) {
    const { resourceId } = await params
    const { week } = await searchParams
    const session = await auth()

    const resource = await getResource(resourceId)

    if (!resource) {
        notFound()
    }

    const canReserve = (session?.user?.isApproved || session?.user?.isAdmin) && resource.isAvailable

    // Get week start (Monday)
    const today = new Date()
    let weekStart: Date
    if (week) {
        weekStart = new Date(week)
    } else {
        const dayOfWeek = today.getDay()
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        weekStart = new Date(today.setDate(diff))
    }
    weekStart.setHours(0, 0, 0, 0)

    const reservations = await getWeekReservations(resourceId, weekStart)

    // Navigation weeks
    const prevWeek = new Date(weekStart)
    prevWeek.setDate(prevWeek.getDate() - 7)
    const nextWeek = new Date(weekStart)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Back button */}
                    <Link
                        href="/reservations"
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        장비 목록
                    </Link>

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0 overflow-hidden relative border border-slate-100 dark:border-slate-800">
                                {resource.image ? (
                                    <img src={resource.image} alt={resource.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Server className="w-8 h-8 text-violet-600" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                                    {resource.name}
                                </h1>
                                <p className="text-slate-600 dark:text-slate-400">
                                    {resource.description}
                                </p>
                                <span className={`inline-block mt-2 px-3 py-1 text-xs font-bold rounded-full ${resource.isAvailable
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {resource.isAvailable ? '예약 가능' : '예약 불가'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Weekly Calendar */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                                {/* Week Navigation */}
                                <div className="flex items-center justify-between mb-6">
                                    <Link
                                        href={`/reservations/${resourceId}?week=${prevWeek.toISOString().split('T')[0]}`}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </Link>
                                    <div className="text-center">
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {weekStart.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                                            {' - '}
                                            {weekEnd.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                                        </h2>
                                        <p className="text-sm text-slate-500">주간 예약 현황</p>
                                    </div>
                                    <Link
                                        href={`/reservations/${resourceId}?week=${nextWeek.toISOString().split('T')[0]}`}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </Link>
                                </div>

                                <WeeklyCalendar
                                    weekStart={weekStart}
                                    reservations={reservations.map((r: any) => ({
                                        ...r,
                                        startTime: r.startTime.toISOString(),
                                        endTime: r.endTime.toISOString()
                                    }))}
                                    currentUserId={session?.user?.id}
                                />
                            </div>
                        </div>

                        {/* Reservation Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sticky top-24">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                    새 예약
                                </h2>

                                {!session?.user ? (
                                    <div className="text-center py-8">
                                        <p className="text-slate-500 mb-4">예약하려면 로그인이 필요합니다</p>
                                        <Link href="/api/auth/signin" className="text-blue-600 hover:underline">
                                            로그인하기
                                        </Link>
                                    </div>
                                ) : !canReserve ? (
                                    <div className="text-center py-8">
                                        <p className="text-slate-500">
                                            {!resource.isAvailable ? '현재 예약할 수 없는 장비입니다' : '승인된 멤버만 예약할 수 있습니다'}
                                        </p>
                                    </div>
                                ) : (
                                    <ReservationForm resourceId={resourceId} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
