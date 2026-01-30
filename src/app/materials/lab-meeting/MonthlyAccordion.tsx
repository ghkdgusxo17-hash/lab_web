'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Users, FileText, ChevronRight, ChevronDown } from 'lucide-react'

interface Meeting {
    id: string
    date: Date
    title: string
    description: string | null
    presenters: { id: string; name: string | null; image: string | null }[]
    materialsCount: number
}

interface Props {
    groupedMeetings: Record<string, Meeting[]>
    sortedKeys: string[]
}

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
    })
}

export function MonthlyAccordion({ groupedMeetings, sortedKeys }: Props) {
    // 첫 번째 월은 기본적으로 펼침
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
        new Set(sortedKeys.length > 0 ? [sortedKeys[0]] : [])
    )

    function toggleMonth(yearMonth: string) {
        setExpandedMonths(prev => {
            const next = new Set(prev)
            if (next.has(yearMonth)) {
                next.delete(yearMonth)
            } else {
                next.add(yearMonth)
            }
            return next
        })
    }

    return (
        <div className="space-y-4">
            {sortedKeys.map((yearMonth) => {
                const [year, month] = yearMonth.split('-')
                const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
                const isExpanded = expandedMonths.has(yearMonth)
                const meetingCount = groupedMeetings[yearMonth].length

                return (
                    <div key={yearMonth} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        {/* Header - 클릭하면 접고 펼침 */}
                        <button
                            onClick={() => toggleMonth(yearMonth)}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                                    {monthName}
                                </span>
                                <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                    {meetingCount}개
                                </span>
                            </div>
                            <ChevronDown
                                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Content - 펼쳐진 경우만 표시 */}
                        {isExpanded && (
                            <div className="p-4 space-y-3 bg-white dark:bg-slate-900">
                                {groupedMeetings[yearMonth].map((meeting) => (
                                    <Link
                                        key={meeting.id}
                                        href={`/materials/lab-meeting/${meeting.id}`}
                                        className="block p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">
                                                        {formatDate(meeting.date)}
                                                    </span>
                                                    <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                                                        {meeting.title}
                                                    </h4>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                                    {meeting.presenters.length > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-4 h-4" />
                                                            {meeting.presenters.map(p => p.name).join(', ')}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <FileText className="w-4 h-4" />
                                                        자료 {meeting.materialsCount}개
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
