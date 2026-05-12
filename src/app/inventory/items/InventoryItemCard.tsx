'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package, Beaker, Box, Wrench, AlertTriangle, Plus, Minus, MapPin, Calendar } from 'lucide-react'
import { recordInventoryTransaction } from '@/actions/inventory'

interface InventoryItemCardProps {
    item: {
        id: string
        name: string
        category: string
        quantity: number
        unit: string
        minQuantity: number
        location: string | null
        expiryDate: Date | null
        manufacturer: string | null
    }
    canRecord: boolean
}

function getCategoryInfo(category: string) {
    switch (category) {
        case 'REAGENT':
            return { label: '시약', icon: Beaker, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' }
        case 'CONSUMABLE':
            return { label: '소모품', icon: Box, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' }
        case 'EQUIPMENT':
            return { label: '장비', icon: Wrench, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' }
        default:
            return { label: '기타', icon: Package, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' }
    }
}

export function InventoryItemCard({ item, canRecord }: InventoryItemCardProps) {
    const [showTransaction, setShowTransaction] = useState(false)
    const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('OUT')
    const [quantity, setQuantity] = useState(1)
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)

    const categoryInfo = getCategoryInfo(item.category)
    const Icon = categoryInfo.icon
    const isLowStock = item.minQuantity > 0 && item.quantity <= item.minQuantity
    const isExpiringSoon = item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date()

    async function handleTransaction() {
        if (quantity <= 0) return

        setLoading(true)
        const result = await recordInventoryTransaction(item.id, transactionType, quantity, reason || undefined)
        setLoading(false)

        if (result.error) {
            alert(result.error)
        } else {
            setShowTransaction(false)
            setQuantity(1)
            setReason('')
        }
    }

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl border p-4 transition-all hover:shadow-md ${isLowStock
                ? 'border-red-200 dark:border-red-800'
                : 'border-slate-200 dark:border-slate-700'
            }`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${categoryInfo.color}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${categoryInfo.color}`}>
                        {categoryInfo.label}
                    </span>
                </div>
                {isLowStock && (
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-bold">부족</span>
                    </div>
                )}
            </div>

            <Link href={`/inventory/items/${item.id}`} className="block group">
                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1 truncate">
                    {item.name}
                </h3>
            </Link>

            <div className="flex items-center gap-4 mb-3 text-sm text-slate-500 dark:text-slate-400">
                <span className={`font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                    {item.quantity} {item.unit}
                </span>
                {item.minQuantity > 0 && (
                    <span className="text-xs text-slate-400">
                        (최소 {item.minQuantity})
                    </span>
                )}
            </div>

            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 mb-3">
                {item.location && (
                    <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{item.location}</span>
                    </div>
                )}
                {item.expiryDate && (
                    <div className={`flex items-center gap-1 ${isExpired ? 'text-red-600 dark:text-red-400' : isExpiringSoon ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                        <Calendar className="w-3 h-3" />
                        <span>
                            {isExpired ? '만료됨: ' : '유효기간: '}
                            {new Date(item.expiryDate).toLocaleDateString('ko-KR')}
                        </span>
                    </div>
                )}
                {item.manufacturer && (
                    <div className="truncate text-slate-400">
                        {item.manufacturer}
                    </div>
                )}
            </div>

            {/* Transaction Buttons */}
            {canRecord && !showTransaction && (
                <div className="flex gap-2">
                    <button
                        onClick={() => { setTransactionType('IN'); setShowTransaction(true) }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        입고
                    </button>
                    <button
                        onClick={() => { setTransactionType('OUT'); setShowTransaction(true) }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        disabled={item.quantity === 0}
                    >
                        <Minus className="w-4 h-4" />
                        출고
                    </button>
                </div>
            )}

            {/* Transaction Form */}
            {showTransaction && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm font-bold ${transactionType === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                            {transactionType === 'IN' ? '입고' : '출고'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                            min={1}
                            max={transactionType === 'OUT' ? item.quantity : undefined}
                            className="w-20 px-2 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                        />
                        <span className="text-sm text-slate-500">{item.unit}</span>
                    </div>
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="사유 (선택)"
                        className="w-full px-2 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 mb-2"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleTransaction}
                            disabled={loading || quantity <= 0}
                            className={`flex-1 py-1.5 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${transactionType === 'IN'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-red-600 hover:bg-red-700'
                                }`}
                        >
                            {loading ? '처리중...' : '확인'}
                        </button>
                        <button
                            onClick={() => setShowTransaction(false)}
                            className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                            취소
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
