'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteInventoryItem } from '@/actions/inventory'

interface InventoryDeleteButtonProps {
    itemId: string
}

export function InventoryDeleteButton({ itemId }: InventoryDeleteButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleDelete() {
        if (!confirm('정말 이 품목을 삭제하시겠습니까?')) return

        setLoading(true)
        const result = await deleteInventoryItem(itemId)
        setLoading(false)

        if (result.error) {
            alert(result.error)
        } else {
            router.push('/inventory/items')
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
        >
            <Trash2 className="w-4 h-4" />
            {loading ? '삭제 중...' : '삭제'}
        </button>
    )
}
