'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, X } from 'lucide-react'
import { updatePartition } from '@/actions/material-partition'

const EMOJI_OPTIONS = ['📁', '📂', '📊', '📈', '🔬', '🧪', '💾', '📋', '🗂️', '📦', '🔧', '⚙️', '🎯', '📝', '🧬', '🔍', '💡', '📐', '🖥️', '📡']

const COLOR_OPTIONS = [
    { name: 'blue', value: '#3B82F6' },
    { name: 'emerald', value: '#10B981' },
    { name: 'amber', value: '#F59E0B' },
    { name: 'red', value: '#EF4444' },
    { name: 'violet', value: '#8B5CF6' },
    { name: 'pink', value: '#EC4899' },
    { name: 'cyan', value: '#06B6D4' },
    { name: 'orange', value: '#F97316' },
]

interface Props {
    partition: {
        id: string
        name: string
        description: string | null
        emoji: string
        color: string
    }
}

export function EditPartitionButton({ partition }: Props) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(partition.name)
    const [description, setDescription] = useState(partition.description || '')
    const [emoji, setEmoji] = useState(partition.emoji)
    const [color, setColor] = useState(partition.color)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!name.trim()) {
            alert('이름을 입력해주세요.')
            return
        }

        setLoading(true)

        const formData = new FormData()
        formData.set('name', name.trim())
        formData.set('description', description.trim())
        formData.set('emoji', emoji)
        formData.set('color', color)

        const result = await updatePartition(partition.id, formData)

        if (result.error) {
            alert(result.error)
        } else {
            setIsOpen(false)
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                title="수정"
            >
                <Edit className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                파티션 수정
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    이름 *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="파티션 이름"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    설명 (선택)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    placeholder="파티션에 대한 간단한 설명"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm resize-none"
                                />
                            </div>

                            {/* Emoji */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    아이콘
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {EMOJI_OPTIONS.map((e) => (
                                        <button
                                            key={e}
                                            type="button"
                                            onClick={() => setEmoji(e)}
                                            className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                                                emoji === e
                                                    ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500 scale-110'
                                                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    색상
                                </label>
                                <div className="flex gap-2">
                                    {COLOR_OPTIONS.map((c) => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => setColor(c.value)}
                                            className={`w-8 h-8 rounded-full transition-all ${
                                                color === c.value
                                                    ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-110'
                                                    : 'hover:scale-110'
                                            }`}
                                            style={{
                                                backgroundColor: c.value,
                                                ...(color === c.value ? { boxShadow: `0 0 0 2px white, 0 0 0 4px ${c.value}` } : {}),
                                            }}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    미리보기
                                </label>
                                <div
                                    className="p-4 rounded-xl border"
                                    style={{
                                        backgroundColor: `${color}10`,
                                        borderColor: `${color}40`,
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                                            style={{ backgroundColor: `${color}20` }}
                                        >
                                            {emoji}
                                        </span>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white">
                                                {name || '파티션 이름'}
                                            </p>
                                            {description && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                    {description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? '저장 중...' : '저장'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
