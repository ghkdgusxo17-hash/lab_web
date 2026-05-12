'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateLedgerAccount, deleteLedgerAccount } from '@/actions/inventory'
import { Trash2 } from 'lucide-react'

const DEFAULT_SECTIONS = ['연구비', '인건비', '기자재', '출장비', '기타']

interface Account {
    id: string
    section: string
    name: string
    initialBalance: number
    balance: number
    description: string | null
}

export function LedgerAccountEditForm({ account, existingSections = DEFAULT_SECTIONS }: { account: Account, existingSections?: string[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Combine defaults with existing sections and deduplicate
    const sections = Array.from(new Set([...DEFAULT_SECTIONS, ...(existingSections || [])]))

    const [customSection, setCustomSection] = useState(!sections.includes(account.section))

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const form = e.currentTarget
        const formData = new FormData(form)

        const result = await updateLedgerAccount(account.id, formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            router.push('/inventory/ledger')
            router.refresh()
        }
    }

    async function handleDelete() {
        setLoading(true)
        const result = await deleteLedgerAccount(account.id)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            router.push('/inventory/ledger')
            router.refresh()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    섹션 <span className="text-red-500">*</span>
                </label>
                {!customSection ? (
                    <div className="space-y-2">
                        <select
                            name="section"
                            defaultValue={account.section}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            {sections.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => setCustomSection(true)}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            + 새 섹션 직접 입력
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <input
                            type="text"
                            name="section"
                            required
                            defaultValue={account.section}
                            placeholder="섹션명 입력"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="button"
                            onClick={() => setCustomSection(false)}
                            className="text-sm text-slate-500 hover:underline"
                        >
                            기본 섹션 선택
                        </button>
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    항목명 <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="name"
                    required
                    defaultValue={account.name}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    초기 잔액 (원) <span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    name="balance"
                    required
                    defaultValue={account.initialBalance}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    설명 (선택)
                </label>
                <textarea
                    name="description"
                    rows={2}
                    defaultValue={account.description || ''}
                    placeholder="항목에 대한 설명"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                />
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                    취소
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? '저장 중...' : '저장'}
                </button>
            </div>

            {/* Delete Section */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                {!showDeleteConfirm ? (
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        이 항목 삭제
                    </button>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-red-600 dark:text-red-400 text-center">
                            정말 이 항목을 삭제하시겠습니까?
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </form>
    )
}
