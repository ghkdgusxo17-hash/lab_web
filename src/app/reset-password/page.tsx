
'use client'

import { useState, Suspense } from 'react'
import { resetPassword } from '@/actions/auth-reset'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    if (!token) {
        return (
            <div className="text-center text-red-600">
                Invalid or missing token. Please request a new link.
                <div className="mt-4">
                    <Link href="/forgot-password" className="text-blue-600 hover:text-blue-500">
                        Request new link
                    </Link>
                </div>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setStatus('error')
            setMessage("Passwords don't match")
            return
        }

        setStatus('loading')
        const result = await resetPassword(token, password)

        if (result.success) {
            setStatus('success')
            setMessage(result.message)
            setTimeout(() => {
                router.push('/login')
            }, 2000)
        } else {
            setStatus('error')
            setMessage(result.message)
        }
    }

    return (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <input type="hidden" name="token" value={token} />
            <div className="rounded-md shadow-sm -space-y-px">
                <div className="mb-2">
                    <label htmlFor="password" className="sr-only">
                        New Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="appearance-none rounded-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                    />
                </div>
                <div>
                    <label htmlFor="confirm-password" className="sr-only">
                        Confirm New Password
                    </label>
                    <input
                        id="confirm-password"
                        name="confirm-password"
                        type="password"
                        required
                        className="appearance-none rounded-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                    />
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={status === 'loading' || status === 'success'}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {status === 'loading' ? 'Resetting...' : 'Reset Password'}
                </button>
            </div>

            {message && (
                <div className={`text-center text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                </div>
            )}
        </form>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Set new password
                    </h2>
                </div>
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    )
}
