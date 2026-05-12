'use client'

import { useState } from 'react'
import { Send, CheckCircle } from 'lucide-react'
import { submitInquiry } from '@/actions/contact'

export function ContactForm() {
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const result = await submitInquiry(formData)

        if (result.error) {
            setError(result.error)
        } else {
            setSubmitted(true)
        }
        setLoading(false)
    }

    if (submitted) {
        return (
            <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    문의가 접수되었습니다
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                    빠른 시일 내에 답변 드리겠습니다.
                </p>
                <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 text-blue-600 hover:underline"
                >
                    새 문의하기
                </button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        이름 *
                    </label>
                    <input
                        type="text"
                        name="name"
                        required
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="홍길동"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        이메일 *
                    </label>
                    <input
                        type="email"
                        name="email"
                        required
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="example@email.com"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    제목 *
                </label>
                <input
                    type="text"
                    name="subject"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="문의 제목"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    내용 *
                </label>
                <textarea
                    name="message"
                    required
                    rows={5}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="문의 내용을 입력해주세요"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
                {loading ? (
                    '전송 중...'
                ) : (
                    <>
                        <Send className="w-4 h-4" />
                        문의 보내기
                    </>
                )}
            </button>
        </form>
    )
}
