'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deletePurchaseRequest } from '@/actions/inventory'

interface DeleteButtonProps {
    requestId: string
    isPurchased: boolean
}

export function PurchaseDeleteButton({ requestId, isPurchased }: DeleteButtonProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [error, setError] = useState('')

    if (isPurchased) return null

    async function handleDelete() {
        setLoading(true)
        setError('')

        const result = await deletePurchaseRequest(requestId)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            router.push('/inventory/purchase')
            router.refresh()
        }
    }

    if (!showConfirm) {
        return (
            <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
                <Trash2 className="w-4 h-4" />
                삭제
            </button>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    disabled={loading}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                    취소
                </button>
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                >
                    {loading ? '삭제 중...' : '정말 삭제'}
                </button>
            </div>
        </div>
    )
}
