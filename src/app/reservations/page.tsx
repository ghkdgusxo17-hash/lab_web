import { Metadata } from 'next'
import Link from 'next/link'
import { getResources, initializeResources } from '@/actions/resource'
import { getTodayReservations } from '@/actions/reservation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { Server, Calendar, Plus, Clock } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '예약 | CPE Lab',
    description: '연구실 장비 예약 시스템입니다.',
}

function formatTime(date: Date) {
    return new Date(date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export default async function ReservationsPage() {
    const session = await auth()
    if (session?.user?.role === 'ALUMNI') { const { redirect } = await import('next/navigation'); redirect('/board') }
    const isAdmin = session?.user?.isAdmin
    const canReserve = session?.user?.isApproved || isAdmin

    // Initialize resources if none exist
    let resources = await getResources()
    if (resources.length === 0 && isAdmin) {
        await initializeResources()
        resources = await getResources()
    }

    const todayReservations = await getTodayReservations()

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                                장비 예약
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-300">
                                실험 장비를 효율적으로 관리하세요
                            </p>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Resources Grid */}
                        <div className="lg:col-span-2 space-y-8">
                            <section>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Server className="w-5 h-5 text-blue-500" />
                                    장비 목록
                                </h2>

                                {resources.length === 0 ? (
                                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 t-rounded-2xl">
                                        <p className="text-slate-500">등록된 장비가 없습니다</p>
                                        {isAdmin && (
                                            <p className="text-sm text-slate-400 mt-2">관리자가 장비를 초기화합니다...</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {resources.map((resource) => (
                                            <Link
                                                key={resource.id}
                                                href={`/reservations/${resource.id}`}
                                                className="group relative bg-white dark:bg-slate-900 p-6 t-rounded-3xl border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                                            >
                                                <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-2xl text-xs font-bold ${resource.isAvailable
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                    {resource.isAvailable ? '예약 가능' : '예약 불가'}
                                                </div>

                                                <div className="w-12 h-12 t-rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform overflow-hidden relative">
                                                    {resource.image ? (
                                                        <img src={resource.image} alt={resource.name} className="w-full h-full object-cover rounded-xl" />
                                                    ) : (
                                                        <Server className="w-6 h-6 text-violet-600" />
                                                    )}
                                                </div>

                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                                    {resource.name}
                                                </h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 h-10 line-clamp-2">
                                                    {resource.description}
                                                </p>

                                                <div className="text-xs font-medium text-blue-600 group-hover:underline">
                                                    예약 현황 보기 →
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Today's Schedule Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none sticky top-24">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-blue-500" />
                                        오늘의 예약
                                    </h2>
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-sm font-bold text-blue-600 dark:text-blue-400">
                                        {todayReservations.length}
                                    </span>
                                </div>

                                {todayReservations.length > 0 ? (
                                    <div className="space-y-4">
                                        {todayReservations.map((reservation: any) => (
                                            <div
                                                key={reservation.id}
                                                className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 py-1"
                                            >
                                                <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-green-500" />

                                                <div className="mb-1">
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                                                        <Clock className="w-3 h-3 inline mr-1" />
                                                        {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                                                    </span>
                                                    <h4 className="font-bold text-slate-900 dark:text-white">
                                                        {reservation.resource.name}
                                                    </h4>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                    <UserAvatar src={reservation.user.image} name={reservation.user.name} size={16} />
                                                    <span className="font-medium">{reservation.user.name}</span>
                                                    {reservation.purpose && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                            <span className="text-slate-500 truncate">{reservation.purpose}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">오늘 예정된 예약이 없습니다</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
