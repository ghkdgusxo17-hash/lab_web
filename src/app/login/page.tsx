import Link from 'next/link'
import { FlaskConical } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'
import { signIn } from '@/auth'

export default function LoginPage() {
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
                            Welcome Back
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            CPE Lab 연구실 포털에 로그인하세요
                        </p>
                    </div>

                    <LoginForm />

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-4 bg-white dark:bg-slate-900 text-sm font-medium text-slate-400">또는</span>
                        </div>
                    </div>

                    <form
                        action={async () => {
                            "use server"
                            await signIn("google", { redirectTo: "/" })
                        }}
                    >
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google로 계속하기
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
                        아직 계정이 없으신가요?{' '}
                        <Link href="/signup" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                            가입하기
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    )
}
