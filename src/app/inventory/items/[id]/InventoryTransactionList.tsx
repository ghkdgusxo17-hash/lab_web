'use client'

import { Plus, Minus, User } from 'lucide-react'

interface Transaction {
    id: string
    type: string
    quantity: number
    reason: string | null
    createdAt: Date
    performedBy: {
        id: string
        name: string | null
        image: string | null
    }
}

interface InventoryTransactionListProps {
    transactions: Transaction[]
    unit: string
}

export function InventoryTransactionList({ transactions, unit }: InventoryTransactionListProps) {
    if (transactions.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400">
                입출고 기록이 없습니다
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {transactions.map((tx) => (
                <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                    <div className={`p-2 rounded-full ${tx.type === 'IN'
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {tx.type === 'IN' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={`font-bold ${tx.type === 'IN' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {tx.type === 'IN' ? '+' : '-'}{tx.quantity} {unit}
                            </span>
                            {tx.reason && (
                                <span className="text-sm text-slate-500 truncate">
                                    ({tx.reason})
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                            <span>{tx.performedBy.name || '알 수 없음'}</span>
                            <span>•</span>
                            <span>{new Date(tx.createdAt).toLocaleString('ko-KR')}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
