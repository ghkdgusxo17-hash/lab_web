'use client'

import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteReadingPaper } from '@/actions/paper'

export function DeleteReadingPaperButton({ paperId }: { paperId: string }) {
    const router = useRouter()
    async function handleDelete() {
        if (!confirm('이 논문을 삭제하시겠습니까?')) return
        const result = await deleteReadingPaper(paperId)
        if (result.error) alert(result.error)
        else router.refresh()
    }
    return (
        <button onClick={handleDelete} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0">
            <Trash2 className="w-4 h-4" />
        </button>
    )
}
