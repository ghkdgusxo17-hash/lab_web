'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Trash2, User, Upload } from 'lucide-react'
import { updateUserProfile, deleteUser } from '@/actions/user'

const ROLES = [
    { value: 'PROFESSOR', label: '교수' },
    { value: 'PHD', label: '박사과정' },
    { value: 'MS', label: '석사과정' },
    { value: 'BS', label: '학부생' },
    { value: 'ALUMNI', label: '졸업생' },
]

interface UserEditFormProps {
    user: {
        id: string
        name: string | null
        email: string | null
        image: string | null
        role: string
        bio: string | null
        researchInterests: string | null
    }
}

export function UserEditForm({ user }: UserEditFormProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [imageUrl, setImageUrl] = useState(user.image || '')

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setError('')

        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (data.error) {
                setError(data.error)
            } else {
                setImageUrl(data.url)
            }
        } catch (err) {
            setError('업로드 중 오류가 발생했습니다.')
        } finally {
            setUploading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        formData.set('image', imageUrl)
        const result = await updateUserProfile(user.id, formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
            return
        }

        router.push('/admin')
        router.refresh()
    }

    async function handleDelete() {
        if (!confirm('정말 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return

        setLoading(true)
        const result = await deleteUser(user.id)

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
                {/* Profile Image Upload */}
                <div className="flex items-start gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex-shrink-0">
                        {imageUrl ? (
                            <img src={imageUrl} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-400 border-2 border-slate-200 dark:border-slate-700">
                                {user.name?.slice(0, 1) || <User className="w-8 h-8" />}
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            프로필 이미지
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                {uploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                {uploading ? '업로드 중...' : '이미지 선택'}
                            </button>
                            {imageUrl && (
                                <button
                                    type="button"
                                    onClick={() => setImageUrl('')}
                                    className="text-sm text-red-500 hover:underline"
                                >
                                    제거
                                </button>
                            )}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">JPG, PNG, GIF, WebP (최대 5MB)</p>
                    </div>
                </div>

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
                        defaultValue={user.name || ''}
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
                        defaultValue={user.email || ''}
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
                        defaultValue={user.role}
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
                        defaultValue={user.bio || ''}
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
                        defaultValue={user.researchInterests || ''}
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
                    목록으로
                </Link>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                        className="px-6 py-3 text-red-600 dark:text-red-400 font-bold rounded-full border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        type="submit"
                        disabled={loading || uploading}
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
            </div>
        </form>
    )
}
