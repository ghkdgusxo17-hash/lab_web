'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { updatePost } from '@/actions/board'

interface EditPostFormProps {
    postId: string
    initialData: {
        title: string
        content: string
        type: string
    }
}

export function EditPostForm({ postId, initialData }: EditPostFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const formData = new FormData(e.currentTarget)

        try {
            const result = await updatePost(postId, formData)
            if (result?.error) {
                setError(result.error)
                setLoading(false)
            }
        } catch (err: any) {
            if (err?.digest?.includes('NEXT_REDIRECT')) {
                throw err
            }
            setError('오류가 발생했습니다.')
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-lg">
                {/* Type (read-only) */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        게시판
                    </label>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                        {initialData.type === 'NOTICE' ? '공지사항' : '자유게시판'}
                    </span>
                </div>

                {/* Title */}
                <div className="mb-6">
                    <label htmlFor="title" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        제목
                    </label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        required
                        defaultValue={initialData.title}
                        placeholder="제목을 입력하세요"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Content */}
                <div>
                    <label htmlFor="content" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        내용
                    </label>
                    <textarea
                        id="content"
                        name="content"
                        required
                        rows={15}
                        defaultValue={initialData.content}
                        placeholder="내용을 입력하세요"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <Link
                    href={`/board/${postId}`}
                    className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    취소
                </Link>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            저장 중...
                        </span>
                    ) : (
                        '저장하기'
                    )}
                </button>
            </div>
        </form>
    )
}
