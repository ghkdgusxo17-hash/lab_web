'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createUser } from '@/actions/user'

const ROLES = [
    { value: 'PROFESSOR', label: '교수' },
    { value: 'PHD', label: '박사과정' },
    { value: 'MS', label: '석사과정' },
    { value: 'BS', label: '학부생' },
    { value: 'ALUMNI', label: '졸업생' },
]

export function UserCreateForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await createUser(formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
            return
        }

        router.push('/admin')
        router.refresh()
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-lg space-y-6">
                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        이름 *
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="홍길동"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        이메일 *
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="example@university.ac.kr"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        비밀번호 *
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        placeholder="최소 6자 이상"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Role */}
                <div>
                    <label htmlFor="role" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        역할 *
                    </label>
                    <select
                        id="role"
                        name="role"
                        defaultValue="BS"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {ROLES.map((role) => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                    </select>
                </div>

                {/* Bio */}
                <div>
                    <label htmlFor="bio" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        소개
                    </label>
                    <textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        placeholder="간단한 소개를 입력하세요"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>

                {/* Research Interests */}
                <div>
                    <label htmlFor="researchInterests" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        연구 분야
                    </label>
                    <input
                        id="researchInterests"
                        name="researchInterests"
                        type="text"
                        placeholder="예: 머신러닝, 공정최적화, 반응공학"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">쉼표로 구분하여 입력</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <Link
                    href="/admin"
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
                            생성 중...
                        </span>
                    ) : (
                        '생성하기'
                    )}
                </button>
            </div>
        </form>
    )
}
