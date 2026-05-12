'use client'

import { useState } from 'react'
import { updateTaskStatus } from '@/actions/task'

interface TaskStatusChangerProps {
    taskId: string
    currentStatus: string
    isAdmin: boolean
}

const statusOptions = [
    { value: 'IN_PROGRESS', label: '진행중', color: 'bg-yellow-500' },
    { value: 'QUESTION', label: '질문요청', color: 'bg-red-500' },
    { value: 'ANSWERED', label: '답변완료', color: 'bg-blue-500' },
    { value: 'COMPLETED', label: '완료', color: 'bg-green-500' },
]

export function TaskStatusChanger({ taskId, currentStatus, isAdmin }: TaskStatusChangerProps) {
    const [loading, setLoading] = useState(false)

    async function handleStatusChange(newStatus: string) {
        if (newStatus === currentStatus) return
        setLoading(true)

        const result = await updateTaskStatus(taskId, newStatus)

        if (result.error) {
            alert(result.error)
        }
        setLoading(false)
    }

    // Filter available statuses based on role
    const availableStatuses = statusOptions.filter(s => {
        if (isAdmin) return true
        // Non-admin cannot set to ANSWERED
        return s.value !== 'ANSWERED'
    })

    return (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                상태 변경
            </label>
            <div className="flex flex-wrap gap-2">
                {availableStatuses.map((status) => (
                    <button
                        key={status.value}
                        onClick={() => handleStatusChange(status.value)}
                        disabled={loading || status.value === currentStatus}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${status.value === currentStatus
                                ? `${status.color} text-white`
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            } disabled:opacity-50`}
                    >
                        {status.label}
                    </button>
                ))}
            </div>
        </div>
    )
}
