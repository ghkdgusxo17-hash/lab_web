'use client'

import { Trash2 } from 'lucide-react'
import { deleteMaterial } from '@/actions/material'

interface MaterialDeleteButtonProps {
    materialId: string
}

export function MaterialDeleteButton({ materialId }: MaterialDeleteButtonProps) {
    async function handleDelete() {
        if (!confirm('정말 삭제하시겠습니까?')) return

        const result = await deleteMaterial(materialId)
        if (result.error) {
            alert(result.error)
        }
    }

    return (
        <button
            onClick={handleDelete}
            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="삭제"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    )
}
