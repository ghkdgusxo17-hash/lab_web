'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react'
import { addLedgerTransaction, updateLedgerTransaction, deleteLedgerTransaction } from '@/actions/inventory'

interface Transaction {
    id: string
    date: string
    description: string
    expense: number
    income: number
    balance: number
    note: string | null
}

interface LedgerTransactionTableProps {
    accountId: string
    transactions: Transaction[]
    canEdit: boolean
}

function formatCurrency(amount: number) {
    if (amount === 0) return '-'
    return new Intl.NumberFormat('ko-KR').format(amount)
}

function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
}

function formatDateForInput(dateStr: string) {
    const date = new Date(dateStr)
    return date.toISOString().split('T')[0]
}

export function LedgerTransactionTable({ accountId, transactions, canEdit }: LedgerTransactionTableProps) {
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form states for new transaction
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
    const [newDescription, setNewDescription] = useState('')
    const [newExpense, setNewExpense] = useState('')
    const [newIncome, setNewIncome] = useState('')
    const [newNote, setNewNote] = useState('')

    // Form states for editing
    const [editDate, setEditDate] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [editExpense, setEditExpense] = useState('')
    const [editIncome, setEditIncome] = useState('')
    const [editNote, setEditNote] = useState('')

    async function handleAdd() {
        setError('')
        setLoading(true)

        const formData = new FormData()
        formData.set('date', newDate)
        formData.set('description', newDescription)
        formData.set('expense', newExpense || '0')
        formData.set('income', newIncome || '0')
        formData.set('note', newNote)

        const result = await addLedgerTransaction(accountId, formData)

        if (result.error) {
            setError(result.error)
        } else {
            setIsAdding(false)
            setNewDate(new Date().toISOString().split('T')[0])
            setNewDescription('')
            setNewExpense('')
            setNewIncome('')
            setNewNote('')
        }

        setLoading(false)
    }

    function startEdit(tx: Transaction) {
        setEditingId(tx.id)
        setEditDate(formatDateForInput(tx.date))
        setEditDescription(tx.description)
        setEditExpense(tx.expense > 0 ? tx.expense.toString() : '')
        setEditIncome(tx.income > 0 ? tx.income.toString() : '')
        setEditNote(tx.note || '')
    }

    async function handleUpdate() {
        if (!editingId) return

        setError('')
        setLoading(true)

        const formData = new FormData()
        formData.set('date', editDate)
        formData.set('description', editDescription)
        formData.set('expense', editExpense || '0')
        formData.set('income', editIncome || '0')
        formData.set('note', editNote)

        const result = await updateLedgerTransaction(editingId, formData)

        if (result.error) {
            setError(result.error)
        } else {
            setEditingId(null)
        }

        setLoading(false)
    }

    async function handleDelete(transactionId: string) {
        if (!confirm('이 거래 내역을 삭제하시겠습니까?')) return

        setError('')
        setLoading(true)

        const result = await deleteLedgerTransaction(transactionId)

        if (result.error) {
            setError(result.error)
        }

        setLoading(false)
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                    거래 내역
                </h2>
                {canEdit && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-bold rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        추가
                    </button>
                )}
            </div>

            {error && (
                <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-300 w-24">날짜</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-300">내역</th>
                            <th className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-300 w-28">지출</th>
                            <th className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-300 w-28">입금</th>
                            <th className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-300 w-32">잔액</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-300 w-40">비고</th>
                            {canEdit && <th className="px-4 py-3 w-20"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {/* Add new row */}
                        {isAdding && (
                            <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                                <td className="px-4 py-2">
                                    <input
                                        type="date"
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        placeholder="내역 입력"
                                        className="w-full px-2 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        value={newExpense}
                                        onChange={(e) => setNewExpense(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-2 py-1.5 text-sm text-right rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        value={newIncome}
                                        onChange={(e) => setNewIncome(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-2 py-1.5 text-sm text-right rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-2 text-right text-slate-400">-</td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="비고"
                                        className="w-full px-2 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={handleAdd}
                                            disabled={loading}
                                            className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => setIsAdding(false)}
                                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {/* Existing transactions */}
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                {editingId === tx.id ? (
                                    <>
                                        <td className="px-4 py-2">
                                            <input
                                                type="date"
                                                value={editDate}
                                                onChange={(e) => setEditDate(e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                value={editExpense}
                                                onChange={(e) => setEditExpense(e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm text-right rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                value={editIncome}
                                                onChange={(e) => setEditIncome(e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm text-right rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-right text-slate-400">-</td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={editNote}
                                                onChange={(e) => setEditNote(e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={handleUpdate}
                                                    disabled={loading}
                                                    className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors disabled:opacity-50"
                                                >
                                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                            {formatDate(tx.date)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                                            {tx.description}
                                        </td>
                                        <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                                            {formatCurrency(tx.expense)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                                            {formatCurrency(tx.income)}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-bold ${tx.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {new Intl.NumberFormat('ko-KR').format(tx.balance)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                                            {tx.note || '-'}
                                        </td>
                                        {canEdit && (
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => startEdit(tx)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(tx.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </>
                                )}
                            </tr>
                        ))}

                        {/* Empty state */}
                        {transactions.length === 0 && !isAdding && (
                            <tr>
                                <td colSpan={canEdit ? 7 : 6} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                                    거래 내역이 없습니다
                                    {canEdit && (
                                        <button
                                            onClick={() => setIsAdding(true)}
                                            className="block mx-auto mt-2 text-blue-600 hover:text-blue-700"
                                        >
                                            첫 거래 추가하기
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
