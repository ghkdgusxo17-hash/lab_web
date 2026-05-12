import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTasks } from '@/actions/task'
import { getAssignedProjects } from '@/actions/project'
import { getMembersWithTaskCounts } from '@/actions/task-admin'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { Plus, ClipboardList, FolderKanban, FileText, FlaskConical, MoreHorizontal, MessageSquare, Paperclip } from 'lucide-react'
import { AdminMemberSelector } from './AdminMemberSelector'
import { UserAvatar } from '@/components/ui/UserAvatar'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '작업관리 | CPE Lab',
    description: '연구 작업 논의 및 관리',
}

const CATEGORIES = [
    { key: 'ALL', label: '전체', icon: ClipboardList },
    { key: 'PROJECT', label: '과제', icon: FolderKanban },
    { key: 'PAPER', label: '논문', icon: FileText },
    { key: 'EXPERIMENT', label: '실험', icon: FlaskConical },
    { key: 'OTHER', label: '기타', icon: MoreHorizontal },
]

const STATUSES = [
    { key: 'ALL', label: '전체', color: '' },
    { key: 'IN_PROGRESS', label: '진행중', color: 'bg-yellow-100 text-yellow-700' },
    { key: 'QUESTION', label: '질문요청', color: 'bg-red-100 text-red-700' },
    { key: 'ANSWERED', label: '답변완료', color: 'bg-blue-100 text-blue-700' },
    { key: 'COMPLETED', label: '완료', color: 'bg-green-100 text-green-700' },
]

function getStatusInfo(status: string) {
    switch (status) {
        case 'IN_PROGRESS': return { label: '진행중', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
        case 'QUESTION': return { label: '질문요청', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
        case 'ANSWERED': return { label: '답변완료', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
        case 'COMPLETED': return { label: '완료', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
        default: return { label: status, color: 'bg-slate-100 text-slate-700' }
    }
}

function getCategoryInfo(category: string) {
    switch (category) {
        case 'PROJECT': return { label: '과제', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' }
        case 'PAPER': return { label: '논문', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
        case 'EXPERIMENT': return { label: '실험', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' }
        default: return { label: '기타', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' }
    }
}

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
    })
}

interface TasksPageProps {
    searchParams: Promise<{ status?: string; category?: string; projectId?: string; userId?: string }>
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
    const params = await searchParams
    const session = await auth()
    if (session?.user?.role === 'ALUMNI') { redirect('/board') }

    if (!session?.user) {
        return (
            <>
                <Navbar />
                <main className="min-h-screen pt-32 pb-20 px-6">
                    <div className="max-w-5xl mx-auto text-center py-20">
                        <p className="text-slate-500">로그인이 필요합니다.</p>
                    </div>
                </main>
            </>
        )
    }

    const isAdmin = session.user.isAdmin
    const canCreate = session.user.isApproved || isAdmin

    // For admin: get members with task counts for selector
    // For admin with userId param: filter tasks by that user
    let membersWithCounts: any[] = []
    if (isAdmin) {
        membersWithCounts = await getMembersWithTaskCounts()
    }

    const tasks = await getTasks({
        status: params.status,
        category: params.category,
        projectId: params.projectId,
        userId: isAdmin ? params.userId : undefined
    })
    const projects = await getAssignedProjects()

    const currentStatus = params.status || 'ALL'
    const currentCategory = params.category || 'ALL'
    const currentUserId = params.userId || ''

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                작업관리
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                {isAdmin ? '멤버별 작업을 관리합니다' : '나의 작업을 관리합니다'}
                            </p>
                        </div>
                        {canCreate && (
                            <Link
                                href="/tasks/new"
                                className="btn-primary px-5 py-2.5 text-white text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                새 작업
                            </Link>
                        )}
                    </div>

                    {/* Admin Member Selector */}
                    {isAdmin && membersWithCounts.length > 0 && (
                        <AdminMemberSelector
                            members={membersWithCounts}
                            currentUserId={currentUserId}
                            currentStatus={currentStatus}
                            currentCategory={currentCategory}
                        />
                    )}

                    {/* Filters */}
                    <div className="mb-6 -mx-6 px-6 overflow-x-auto">
                        {/* Status Filter */}
                        <div className="inline-flex gap-1 bg-slate-100 dark:bg-slate-800 t-rounded-lg p-1 min-w-max">
                            {STATUSES.map((s) => (
                                <Link
                                    key={s.key}
                                    href={`/tasks?status=${s.key}&category=${currentCategory}${currentUserId ? `&userId=${currentUserId}` : ''}`}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${currentStatus === s.key
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                        }`}
                                >
                                    {s.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="bg-white dark:bg-slate-900 t-rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-x-auto">
                            {CATEGORIES.map((c) => {
                                const Icon = c.icon
                                return (
                                    <Link
                                        key={c.key}
                                        href={`/tasks?status=${currentStatus}&category=${c.key}${currentUserId ? `&userId=${currentUserId}` : ''}`}
                                        className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${currentCategory === c.key
                                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {c.label}
                                    </Link>
                                )
                            })}
                        </div>

                        {/* Tasks List */}
                        {tasks.length === 0 ? (
                            <div className="py-16 text-center">
                                <ClipboardList className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400">
                                    {isAdmin && !currentUserId ? '멤버를 선택해주세요' : '등록된 작업이 없습니다'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {tasks.map((task: any) => {
                                    const statusInfo = getStatusInfo(task.status)
                                    const categoryInfo = getCategoryInfo(task.category)

                                    return (
                                        <Link
                                            key={task.id}
                                            href={`/tasks/${task.id}`}
                                            className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${statusInfo.color}`}>
                                                            {statusInfo.label}
                                                        </span>
                                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${categoryInfo.color}`}>
                                                            {categoryInfo.label}
                                                        </span>
                                                        {task.project && (
                                                            <span className="text-xs text-slate-500">
                                                                {task.project.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                                        {task.title}
                                                    </h3>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <UserAvatar src={task.author.image} name={task.author.name} size={16} />
                                                            {task.author.name}
                                                        </span>
                                                        <span>{formatDate(task.updatedAt)}</span>
                                                        {task._count.comments > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <MessageSquare className="w-3 h-3" />
                                                                {task._count.comments}
                                                            </span>
                                                        )}
                                                        {task._count.attachments > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Paperclip className="w-3 h-3" />
                                                                {task._count.attachments}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    )
}
