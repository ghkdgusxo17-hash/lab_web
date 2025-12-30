'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit, Trash2, Pin, Loader2, MoreHorizontal } from 'lucide-react'
import { deletePost, togglePostPin } from '@/actions/board'

interface PostActionsProps {
    postId: string
    isAdmin: boolean
    isPinned: boolean
}

export function PostActions({ postId, isAdmin, isPinned }: PostActionsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

    async function handleDelete() {
        if (!confirm('정말 삭제하시겠습니까?')) return

        setLoading(true)
        try {
            const result = await deletePost(postId)
            if (result?.error) {
                alert(result.error)
                setLoading(false)
            }
        } catch (err: any) {
            if (err?.digest?.includes('NEXT_REDIRECT')) {
                throw err
            }
            console.error('Delete error:', err)
            alert('삭제 중 오류가 발생했습니다.')
            setLoading(false)
        }
    }

    async function handleTogglePin() {
        setLoading(true)
        await togglePostPin(postId)
        setLoading(false)
        setShowMenu(false)
        router.refresh()
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
                <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl z-20 py-2">
                        <Link
                            href={`/board/${postId}/edit`}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                            수정하기
                        </Link>

                        {isAdmin && (
                            <button
                                onClick={handleTogglePin}
                                disabled={loading}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                <Pin className="w-4 h-4" />
                                {isPinned ? '고정 해제' : '상단 고정'}
                            </button>
                        )}

                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            삭제하기
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
