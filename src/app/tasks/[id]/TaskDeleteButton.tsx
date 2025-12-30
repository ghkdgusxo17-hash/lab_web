'use client'

import { Trash2 } from 'lucide-react'
import { deleteTask } from '@/actions/task'

interface TaskDeleteButtonProps {
    taskId: string
}

export function TaskDeleteButton({ taskId }: TaskDeleteButtonProps) {
    async function handleDelete() {
        if (!confirm('이 작업을 삭제하시겠습니까? 모든 댓글과 첨부파일도 함께 삭제됩니다.')) return

        try {
            const result = await deleteTask(taskId)
            if (result?.error) {
                alert(result.error)
            }
        } catch (err: any) {
            if (err?.digest?.includes('NEXT_REDIRECT')) {
                throw err
            }
            console.error(err)
        }
    }

    return (
        <button
            onClick={handleDelete}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="삭제"
        >
            <Trash2 className="w-5 h-5" />
        </button>
    )
}
