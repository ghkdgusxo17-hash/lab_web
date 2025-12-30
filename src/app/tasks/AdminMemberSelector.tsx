'use client'

import Link from 'next/link'

interface MemberWithCounts {
    id: string
    name: string | null
    image: string | null
    taskCounts: {
        IN_PROGRESS: number
        QUESTION: number
        ANSWERED: number
        COMPLETED: number
    }
    totalTasks: number
}

interface AdminMemberSelectorProps {
    members: MemberWithCounts[]
    currentUserId: string
    currentStatus: string
    currentCategory: string
}

export function AdminMemberSelector({ members, currentUserId, currentStatus, currentCategory }: AdminMemberSelectorProps) {
    return (
        <div className="mb-6">
            <h2 className="text-sm font-medium text-slate-500 mb-3">멤버 선택</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {members.map((member) => {
                    const isSelected = member.id === currentUserId
                    const hasQuestions = member.taskCounts.QUESTION > 0

                    return (
                        <Link
                            key={member.id}
                            href={`/tasks?status=${currentStatus}&category=${currentCategory}&userId=${member.id}`}
                            className={`p-4 rounded-xl border transition-all ${isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : hasQuestions
                                    ? 'border-red-200 bg-red-50 dark:bg-red-900/10 hover:border-red-300'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                {member.image ? (
                                    <img src={member.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                                        {member.name?.charAt(0) || '?'}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{member.name || '이름 없음'}</h3>
                                    <p className="text-xs text-slate-500">전체 {member.totalTasks}건</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1 text-xs">
                                {member.taskCounts.IN_PROGRESS > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                                        진행중 {member.taskCounts.IN_PROGRESS}
                                    </span>
                                )}
                                {member.taskCounts.QUESTION > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">
                                        질문요청 {member.taskCounts.QUESTION}
                                    </span>
                                )}
                                {member.taskCounts.ANSWERED > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                        답변완료 {member.taskCounts.ANSWERED}
                                    </span>
                                )}
                                {member.taskCounts.COMPLETED > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-green-100 text-green-700">
                                        완료 {member.taskCounts.COMPLETED}
                                    </span>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
