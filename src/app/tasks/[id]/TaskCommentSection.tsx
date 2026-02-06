'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { addTaskComment } from '@/actions/task'
import { MedalBadge } from '@/components/ui/MedalBadge'

interface Comment {
    id: string
    content: string
    author: {
        id: string
        name: string | null
        image: string | null
        medalPoints?: number
    }
    createdAt: string
}

interface TaskCommentSectionProps {
    taskId: string
    comments: Comment[]
    canComment: boolean
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export function TaskCommentSection({ taskId, comments, canComment }: TaskCommentSectionProps) {
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!content.trim()) return

        setLoading(true)
        const result = await addTaskComment(taskId, content)

        if (result.error) {
            alert(result.error)
        } else {
            setContent('')
        }
        setLoading(false)
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                토의
                <span className="text-sm font-normal text-slate-500">({comments.length})</span>
            </h2>

            {/* Comments List */}
            {comments.length > 0 && (
                <div className="space-y-4 mb-6">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <div className="flex-shrink-0">
                                {comment.author.image ? (
                                    <img src={comment.author.image} alt="" className="w-8 h-8 rounded-full" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-slate-900 dark:text-white text-sm">
                                        {comment.author.name || '익명'}
                                        {' '}<MedalBadge medalPoints={comment.author.medalPoints || 0} size="sm" />
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {formatDate(comment.createdAt)}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                    {comment.content}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Comment Form */}
            {canComment && (
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="댓글을 입력하세요..."
                        rows={2}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <button
                        type="submit"
                        disabled={loading || !content.trim()}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all self-end"
                    >
                        {loading ? '...' : '등록'}
                    </button>
                </form>
            )}
        </div>
    )
}
