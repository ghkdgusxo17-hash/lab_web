'use client'

import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteLabPaper, deletePaperRevision } from '@/actions/paper'

export function DeletePaperButton({ paperId }: { paperId: string }) {
    const router = useRouter()
    async function handleDelete() {
        if (!confirm('이 논문과 모든 리비전을 삭제하시겠습니까?')) return
        const result = await deleteLabPaper(paperId)
        if (result.error) alert(result.error)
        else router.push('/materials/paper/lab')
    }
    return (
        <button onClick={handleDelete} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
            삭제
        </button>
    )
}

export function DeleteRevisionButton({ revisionId }: { revisionId: string }) {
    const router = useRouter()
    async function handleDelete() {
        if (!confirm('이 리비전을 삭제하시겠습니까?')) return
        const result = await deletePaperRevision(revisionId)
        if (result.error) alert(result.error)
        else router.refresh()
    }
    return (
        <button onClick={handleDelete} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
            <Trash2 className="w-4 h-4" />
        </button>
    )
}
