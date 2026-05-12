'use client'
import { Trash2, CheckCircle, XCircle } from 'lucide-react'

export function DeleteButton({ id }: { id: string }) {
    return (
        <button
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (confirm('정말 삭제하시겠습니까?')) alert('삭제되었습니다 (Mock)')
            }}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors z-20 relative"
            title="삭제"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    )
}

export function ReservationControls({ id }: { id: string }) {
    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => alert('승인되었습니다 (Mock)')}
                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                title="승인"
            >
                <CheckCircle className="w-5 h-5" />
            </button>
            <button
                onClick={() => alert('거절되었습니다 (Mock)')}
                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                title="거절"
            >
                <XCircle className="w-5 h-5" />
            </button>
        </div>
    )
}
