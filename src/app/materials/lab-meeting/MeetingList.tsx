import Link from 'next/link'
import { Calendar, Users, FileText, ChevronRight } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'

interface Meeting {
    id: string
    date: Date
    title: string
    description: string | null
    presenters: { id: string; name: string | null; image: string | null }[]
    materialsCount: number
}

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
    })
}

export function MeetingList({ meetings }: { meetings: Meeting[] }) {
    if (meetings.length === 0) {
        return (
            <div className="text-center py-16">
                <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    미팅이 없습니다
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    이 기간에 등록된 랩미팅이 없습니다
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {meetings.map((meeting) => (
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
                                    <span className="flex items-center gap-1.5">
                                        <div className="flex items-center -space-x-1">
                                            {meeting.presenters.slice(0, 3).map(p => (
                                                <UserAvatar key={p.id} src={p.image} name={p.name} size={20} className="ring-2 ring-white dark:ring-slate-900" />
                                            ))}
                                        </div>
                                        <span>{meeting.presenters.map(p => p.name).join(', ')}</span>
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <FileText className="w-4 h-4" />
                                    자료 {meeting.materialsCount}개
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" />
                    </div>
                </Link>
            ))}
        </div>
    )
}
