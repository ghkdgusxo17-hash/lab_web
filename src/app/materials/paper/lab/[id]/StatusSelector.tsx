'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateLabPaperStatus } from '@/actions/paper'

const STATUSES = [
    { value: 'WRITING',      label: '작성중',  color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    { value: 'SUBMITTED',    label: '투고',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'UNDER_REVIEW', label: '심사중',  color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { value: 'REVISION',     label: '리비전',  color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    { value: 'ACCEPTED',     label: '수락',    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    { value: 'PUBLISHED',    label: '게재',    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
]

export function StatusSelector({ paperId, currentStatus }: { paperId: string; currentStatus: string }) {
    const router = useRouter()
    const [status, setStatus] = useState(currentStatus)
    const [loading, setLoading] = useState(false)

    async function handleChange(newStatus: string) {
        if (newStatus === status) return
        setLoading(true)
        await updateLabPaperStatus(paperId, newStatus)
        setStatus(newStatus)
        setLoading(false)
        router.refresh()
    }

    return (
        <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
                <button
                    key={s.value}
                    onClick={() => handleChange(s.value)}
                    disabled={loading}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                        status === s.value
                            ? s.color + ' ring-2 ring-offset-1 ring-current'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 hover:opacity-80'
                    }`}
                >
                    {s.label}
                </button>
            ))}
        </div>
    )
}
