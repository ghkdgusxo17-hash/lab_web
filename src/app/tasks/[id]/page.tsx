import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getTask } from '@/actions/task'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { ArrowLeft, Paperclip, Download } from 'lucide-react'
import { MedalBadge } from '@/components/ui/MedalBadge'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { TaskStatusChanger } from './TaskStatusChanger'
import { TaskCommentSection } from './TaskCommentSection'
import { TaskAttachmentUpload } from './TaskAttachmentUpload'
import { TaskDeleteButton } from './TaskDeleteButton'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const task = await getTask(id)
    return {
        title: task ? `${task.title} | 작업관리` : '작업 상세',
    }
}

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
        case 'PROJECT': return { label: '연구과제', color: 'bg-purple-100 text-purple-700' }
        case 'PAPER': return { label: '논문', color: 'bg-blue-100 text-blue-700' }
        case 'EXPERIMENT': return { label: '실험', color: 'bg-orange-100 text-orange-700' }
        default: return { label: '기타', color: 'bg-slate-100 text-slate-700' }
    }
}

function formatDate(date: Date) {
    return new Date(date).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

interface TaskDetailPageProps {
    params: Promise<{ id: string }>
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
        redirect('/api/auth/signin')
    }

    const task = await getTask(id)

    if (!task) {
        notFound()
    }

    const statusInfo = getStatusInfo(task.status)
    const categoryInfo = getCategoryInfo(task.category)
    const isAuthor = task.authorId === session.user.id
    const isAdmin = session.user.isAdmin
    const canModify = isAuthor || isAdmin

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Back button */}
                    <Link
                        href="/tasks"
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        목록으로
                    </Link>

                    {/* Task Header */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-3 py-1 text-sm font-bold rounded-full ${statusInfo.color}`}>
                                    {statusInfo.label}
                                </span>
                                <span className={`px-3 py-1 text-sm font-bold rounded-full ${categoryInfo.color}`}>
                                    {categoryInfo.label}
                                </span>
                                {task.project && (
                                    <span className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                                        {task.project.name}
                                    </span>
                                )}
                            </div>
                            {canModify && (
                                <TaskDeleteButton taskId={task.id} />
                            )}
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            {task.title}
                        </h1>

                        <div className="flex items-center gap-3 text-sm text-slate-500 mb-6">
                            <div className="flex items-center gap-2">
                                <UserAvatar src={task.author.image} name={task.author.name} size={24} />
                                <span>
                                    {task.author.name}
                                    {' '}<MedalBadge medalPoints={(task.author as any).medalPoints || 0} size="sm" />
                                </span>
                            </div>
                            <span>•</span>
                            <span>{formatDate(task.createdAt)}</span>
                        </div>

                        <div className="prose dark:prose-invert max-w-none prose-img:rounded-xl prose-img:max-w-full">
                            <div
                                className="text-slate-700 dark:text-slate-300"
                                dangerouslySetInnerHTML={{ __html: task.content }}
                            />
                        </div>

                        {/* Status Changer */}
                        {canModify && (
                            <TaskStatusChanger
                                taskId={task.id}
                                currentStatus={task.status}
                                isAdmin={isAdmin}
                            />
                        )}
                    </div>

                    {/* Attachments */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Paperclip className="w-5 h-5" />
                            첨부파일
                            <span className="text-sm font-normal text-slate-500">({task.attachments.length})</span>
                        </h2>

                        {task.attachments.length > 0 && (
                            <div className="space-y-2 mb-4">
                                {task.attachments.map((att: any) => (
                                    <div key={att.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                                {att.filename}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {formatFileSize(att.size)}
                                            </span>
                                        </div>
                                        <a
                                            href={`/api/tasks/${task.id}/attachments/${att.id}`}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="다운로드"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}

                        {canModify && (
                            <TaskAttachmentUpload taskId={task.id} />
                        )}
                    </div>

                    {/* Comments */}
                    <TaskCommentSection
                        taskId={task.id}
                        comments={task.comments.map((c: any) => ({
                            ...c,
                            createdAt: c.createdAt.toISOString()
                        }))}
                        canComment={canModify}
                    />
                </div>
            </main>
        </>
    )
}
