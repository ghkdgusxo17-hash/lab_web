'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deletePartition } from '@/actions/material-partition'

interface Props {
    partitionId: string
    category: string
}

export function DeletePartitionButton({ partitionId, category }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleDelete() {
        if (!confirm('파티션을 삭제하시겠습니까?\n(파티션 내 파일은 삭제되지 않고 미분류로 이동합니다)')) return

        setLoading(true)
        const result = await deletePartition(partitionId)

        if (result.error) {
            alert(result.error)
            setLoading(false)
        } else {
            router.push(`/materials?category=${category}`)
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
            title="삭제"
        >
            <Trash2 className="w-5 h-5" />
        </button>
    )
}
