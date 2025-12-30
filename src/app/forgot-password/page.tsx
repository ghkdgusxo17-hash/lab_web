
'use client'

import { useState } from 'react'
import { requestPasswordReset } from '@/actions/auth-reset'
import Link from 'next/link'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('loading')

        const result = await requestPasswordReset(email)

        if (result.success) {
            setStatus('success')
            setMessage(result.message)
        } else {
            setStatus('error')
            setMessage(result.message)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        비밀번호 찾기
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        가입한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                이메일 주소
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="이메일 주소"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={status === 'loading' || status === 'success'}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {status === 'loading' ? '전송 중...' : '재설정 링크 보내기'}
                        </button>
                    </div>

                    {message && (
                        <div className={`text-center text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message}
                        </div>
                    )}

                    <div className="text-sm text-center">
                        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            로그인 화면으로 돌아가기
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
