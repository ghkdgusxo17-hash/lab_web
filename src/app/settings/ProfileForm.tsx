'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, User, Upload, X, Plus } from 'lucide-react'
import { updateMyProfile } from '@/actions/profile'
import { useSession } from 'next-auth/react'

interface ProfileFormProps {
    profile: {
        id: string
        name: string | null
        email: string | null
        image: string | null
        bio: string | null
        researchInterests: string | null
    }
}

export function ProfileForm({ profile }: ProfileFormProps) {
    const { update } = useSession()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [imageUrl, setImageUrl] = useState(profile.image || '')

    // Tag-based research interests
    const [tags, setTags] = useState<string[]>(() => {
        if (!profile.researchInterests) return []
        // Try to parse as JSON array first, fallback to comma-separated
        try {
            const parsed = JSON.parse(profile.researchInterests)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return profile.researchInterests.split(',').map(s => s.trim()).filter(Boolean)
        }
    })
    const [tagInput, setTagInput] = useState('')

    function addTag() {
        const trimmed = tagInput.trim()
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed])
            setTagInput('')
        }
    }

    function removeTag(tagToRemove: string) {
        setTags(tags.filter(tag => tag !== tagToRemove))
    }

    function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault()
            addTag()
        }
    }

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
        setSuccess(false)
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        formData.set('image', imageUrl)
        // Save tags as JSON array string
        formData.set('researchInterests', JSON.stringify(tags))

        const result = await updateMyProfile(formData)

        if (result.error) {
            setError(result.error)
        } else {
            // Trigger session update to refresh user data in client
            await update()
            setSuccess(true)
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm font-medium">
                    프로필이 저장되었습니다!
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-lg space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative">
                        {imageUrl ? (
                            <img src={imageUrl} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-400 border-2 border-slate-200 dark:border-slate-700">
                                {profile.name?.slice(0, 1) || '?'}
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
                    </div>
                </div>

                {/* Name (Editable) */}
                <div>
                    <label htmlFor="name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        이름
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        defaultValue={profile.name || ''}
                        placeholder="표시될 이름을 입력하세요"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">구성원 페이지 및 게시판에 표시되는 이름입니다</p>
                </div>


                {/* Profile Image Upload */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        프로필 이미지
                    </label>
                    <div className="flex items-center gap-4">
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

                {/* Bio */}
                <div>
                    <label htmlFor="bio" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        자기소개
                    </label>
                    <textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        defaultValue={profile.bio || ''}
                        placeholder="간단한 소개를 입력하세요"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>

                {/* Research Interests - Tag Input */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        연구 분야
                    </label>

                    {/* Tags Display */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>

                    {/* Tag Input */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            placeholder="키워드 입력 후 Enter 또는 추가 버튼"
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="button"
                            onClick={addTag}
                            className="px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" />
                            추가
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">연구 키워드를 하나씩 추가하세요 (구성원 카드에 표시됩니다)</p>
                </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
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
        </form>
    )
}
