import Link from 'next/link'
import { Calendar, FileText } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'

interface MonthStat {
    month: number
    meetingCount: number
    materialsCount: number
    presenters: { id: string; name: string | null; image: string | null }[]
}

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export function MonthGrid({ year, monthStats }: { year: number; monthStats: MonthStat[] }) {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    return (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {monthStats.map((stat) => {
                const isCurrentMonth = year === currentYear && stat.month === currentMonth
                const hasMeetings = stat.meetingCount > 0
                const maxAvatars = 3
                const overflowCount = stat.presenters.length - maxAvatars

                if (!hasMeetings) {
                    return (
                        <div
                            key={stat.month}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 opacity-50 cursor-default"
                        >
                            <div className="text-lg font-semibold text-slate-400 dark:text-slate-600 mb-1">
                                {MONTH_NAMES[stat.month - 1]}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-600">
                                미팅 없음
                            </div>
                        </div>
                    )
                }

                return (
                    <Link
                        key={stat.month}
                        href={`/materials/lab-meeting?year=${year}&month=${stat.month}`}
                        className={`p-4 rounded-xl border transition-all group ${
                            isCurrentMonth
                                ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {MONTH_NAMES[stat.month - 1]}
                            </span>
                            {isCurrentMonth && (
                                <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded-full">
                                    이번 달
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {stat.meetingCount}회
                            </span>
                            <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {stat.materialsCount}개
                            </span>
                        </div>
                        {stat.presenters.length > 0 && (
                            <div className="flex items-center -space-x-1.5">
                                {stat.presenters.slice(0, maxAvatars).map((p) => (
                                    <UserAvatar key={p.id} src={p.image} name={p.name} size={24} className="ring-2 ring-white dark:ring-slate-900" />
                                ))}
                                {overflowCount > 0 && (
                                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-900 flex items-center justify-center text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                        +{overflowCount}
                                    </span>
                                )}
                            </div>
                        )}
                    </Link>
                )
            })}
        </div>
    )
}
