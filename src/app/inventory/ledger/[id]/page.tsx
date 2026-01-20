import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { getLedgerAccountWithTransactions } from '@/actions/inventory'
import { ArrowLeft, Pencil } from 'lucide-react'
import { LedgerTransactionTable } from './LedgerTransactionTable'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '장부 상세 | CPE Lab',
}

interface LedgerDetailPageProps {
    params: Promise<{ id: string }>
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0
    }).format(amount)
}

export default async function LedgerDetailPage({ params }: LedgerDetailPageProps) {
    const { id } = await params
    const session = await auth()
    const isAdmin = session?.user?.isAdmin

    const account = await getLedgerAccountWithTransactions(id)

    if (!account) {
        notFound()
    }

    // Serialize dates for client component
    const serializedTransactions = account.transactions.map(tx => ({
        ...tx,
        date: tx.date.toISOString(),
        createdAt: tx.createdAt.toISOString(),
        updatedAt: tx.updatedAt.toISOString(),
    }))

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                                <Link href="/inventory" className="hover:text-blue-600">자원관리</Link>
                                <span>/</span>
                                <Link href="/inventory/ledger" className="hover:text-blue-600">장부</Link>
                                <span>/</span>
                                <span>{account.section}</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                {account.name}
                            </h1>
                            {account.description && (
                                <p className="text-slate-600 dark:text-slate-400">
                                    {account.description}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/inventory/ledger"
                                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                목록
                            </Link>
                            {isAdmin && (
                                <Link
                                    href={`/inventory/ledger/${id}/edit`}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                    항목 수정
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Balance Summary */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-8 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    현재 잔액
                                </p>
                                <p className={`text-3xl font-bold ${account.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {formatCurrency(account.balance)}
                                </p>
                            </div>
                            <div className="text-right text-sm text-slate-500 dark:text-slate-400">
                                <p>섹션: {account.section}</p>
                                <p>거래 {account.transactions.length}건</p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Table */}
                    <LedgerTransactionTable
                        accountId={id}
                        transactions={serializedTransactions}
                        isAdmin={isAdmin || false}
                    />
                </div>
            </main>
        </>
    )
}
