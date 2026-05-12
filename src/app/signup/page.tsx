'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FlaskConical, ArrowRight, Loader2 } from 'lucide-react'
import { registerUser } from '@/actions/user'

export default function SignupPage() {
    const router = useRouter()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await registerUser(formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
            return
        }

        router.push('/login?registered=true')
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white/20 dark:border-slate-700 shadow-2xl">
                    {/* Logo */}
                    <div className="text-center mb-10">
                        <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                                <FlaskConical className="w-7 h-7" />
                            </div>
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            회원가입
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            CPE Lab 연구실 포털에 가입하세요
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                이름
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                placeholder="홍길동"
                                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                이메일
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="name@university.ac.kr"
                                autoComplete="email"
                                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                비밀번호
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                autoComplete="new-password"
                                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <p className="mt-2 text-xs text-slate-500">최소 6자 이상</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    처리 중...
                                </>
                            ) : (
                                <>
                                    가입하기
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
                        이미 계정이 있으신가요?{' '}
                        <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                            로그인
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    )
}
