'use client'

import { useState } from 'react'
import { Loader2, Send, Trash2, Edit2, X, Check } from 'lucide-react'
import { createComment, updateComment, deleteComment } from '@/actions/comment'
import { MedalBadge } from '@/components/ui/MedalBadge'

interface Comment {
    id: string
    content: string
    authorId: string
    createdAt: string
    author: {
        id: string
        name: string | null
        image: string | null
        medalPoints?: number
    }
}

interface CommentSectionProps {
    postId: string
    comments: Comment[]
    currentUserId?: string
    isAdmin?: boolean
    canComment?: boolean
}

export function CommentSection({ postId, comments: initialComments, currentUserId, isAdmin, canComment }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState('')
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!newComment.trim()) return

        setLoading(true)
        setError('')

        const result = await createComment(postId, newComment)

        if (result.error) {
            setError(result.error)
            setLoading(false)
            return
        }

        if (result.comment) {
            setComments([...comments, { ...result.comment, createdAt: new Date().toISOString() }])
        }
        setNewComment('')
        setLoading(false)
    }

    async function handleUpdate(commentId: string) {
        if (!editContent.trim()) return

        setLoading(true)
        const result = await updateComment(commentId, editContent)

        if (result.error) {
            setError(result.error)
            setLoading(false)
            return
        }

        setComments(comments.map(c =>
            c.id === commentId ? { ...c, content: editContent } : c
        ))
        setEditingId(null)
        setEditContent('')
        setLoading(false)
    }

    async function handleDelete(commentId: string) {
        if (!confirm('댓글을 삭제하시겠습니까?')) return

        setLoading(true)
        const result = await deleteComment(commentId)

        if (result.error) {
            setError(result.error)
            setLoading(false)
            return
        }

        setComments(comments.filter(c => c.id !== commentId))
        setLoading(false)
    }

    function startEdit(comment: Comment) {
        setEditingId(comment.id)
        setEditContent(comment.content)
    }

    function cancelEdit() {
        setEditingId(null)
        setEditContent('')
    }

    return (
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                댓글 {comments.length > 0 && <span className="text-blue-600">({comments.length})</span>}
            </h3>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Comment List */}
            <div className="space-y-4 mb-6">
                {comments.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                        아직 댓글이 없습니다.
                    </p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            {/* Avatar */}
                            {comment.author.image ? (
                                <img
                                    src={comment.author.image}
                                    alt=""
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">
                                    {comment.author.name?.slice(0, 1) || '?'}
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-slate-900 dark:text-white text-sm">
                                        {comment.author.name || '알 수 없음'}
                                        {' '}<MedalBadge medalPoints={comment.author.medalPoints || 0} size="sm" />
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {new Date(comment.createdAt).toLocaleDateString('ko-KR', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>

                                {editingId === comment.id ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={() => handleUpdate(comment.id)}
                                            disabled={loading}
                                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap">
                                        {comment.content}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            {!editingId && (comment.authorId === currentUserId || isAdmin) && (
                                <div className="flex items-start gap-1">
                                    <button
                                        onClick={() => startEdit(comment)}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* New Comment Form */}
            {canComment ? (
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="댓글을 입력하세요..."
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                    <button
                        type="submit"
                        disabled={loading || !newComment.trim()}
                        className="px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </form>
            ) : (
                <p className="text-center text-slate-500 dark:text-slate-400 text-sm py-4">
                    승인된 회원만 댓글을 작성할 수 있습니다.
                </p>
            )}
        </div>
    )
}
