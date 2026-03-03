import Link from 'next/link'
import { Calendar, Users, FileText, Trophy, CheckCircle } from 'lucide-react'

interface YearStat {
    year: number
    meetingCount: number
    materialsCount: number
    presenterCount: number
    monthsWithMeetings: number[]
    mvp: { name: string; count: number } | null
}

export function YearCardList({ yearStats }: { yearStats: YearStat[] }) {
    const currentYear = new Date().getFullYear()

    if (yearStats.length === 0) {
        return (
            <div className="text-center py-20">
                <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    등록된 랩미팅이 없습니다
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                    새 랩미팅을 생성하여 자료를 관리해보세요
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {yearStats.map((stat) => {
                const isCurrentYear = stat.year === currentYear
                const isPastYear = stat.year < currentYear

                return (
                    <Link
                        key={stat.year}
                        href={`/materials/lab-meeting?year=${stat.year}`}
                        className="block p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {stat.year}년
                            </h3>
                            {isPastYear && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                    <CheckCircle className="w-3 h-3" />
                                    완료
                                </span>
                            )}
                            {isCurrentYear && (
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                    진행 중
                                </span>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-2">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {stat.meetingCount}회
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {stat.presenterCount}명
                            </span>
                            <span className="flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                {stat.materialsCount}개
                            </span>
                        </div>

                        {/* MVP */}
                        {stat.mvp && (
                            <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                                <Trophy className="w-3.5 h-3.5" />
                                <span>MVP: {stat.mvp.name} ({stat.mvp.count}회)</span>
                            </div>
                        )}
                    </Link>
                )
            })}
        </div>
    )
}
