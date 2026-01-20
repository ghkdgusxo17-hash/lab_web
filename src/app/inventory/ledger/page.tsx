import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { Plus, BookOpen, Wallet, Pencil, FolderOpen } from 'lucide-react'
import { getLedgerAccounts, getLedgerSummary } from '@/actions/inventory'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '장부 | CPE Lab',
    description: '연구실 예산 관리',
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0
    }).format(amount)
}

export default async function LedgerPage() {
    const session = await auth()
    const isAdmin = session?.user?.isAdmin

    const [accounts, summary] = await Promise.all([
        getLedgerAccounts(),
        getLedgerSummary()
    ])

    // Group accounts by section
    const groupedAccounts = accounts.reduce((groups: Record<string, typeof accounts>, account: any) => {
        const section = account.section || '기본'
        if (!groups[section]) {
            groups[section] = []
        }
        groups[section].push(account)
        return groups
    }, {})

    const sections = Object.keys(groupedAccounts).sort()

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                                <Link href="/inventory" className="hover:text-blue-600">자원관리</Link>
                                <span>/</span>
                                <span>장부</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                장부
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                예산 잔액을 관리합니다
                            </p>
                        </div>
                        {isAdmin && (
                            <Link
                                href="/inventory/ledger/new"
                                className="btn-primary px-5 py-2.5 text-white text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                항목 추가
                            </Link>
                        )}
                    </div>

                    {/* Total Summary */}
                    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-8 shadow-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 dark:from-blue-900/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    총 잔액
                                </p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {formatCurrency(summary.totalBalance)}
                                </p>
                                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                                    {sections.length}개 섹션 · {summary.accountCount}개 항목
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                                <Wallet className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    {/* Sections */}
                    {sections.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center">
                            <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">
                                등록된 항목이 없습니다
                            </p>
                            {isAdmin && (
                                <Link
                                    href="/inventory/ledger/new"
                                    className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                                >
                                    <Plus className="w-4 h-4" />
                                    첫 항목 추가하기
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {sections.map((section) => {
                                const sectionAccounts = groupedAccounts[section]
                                const sectionTotal = sectionAccounts.reduce((sum: number, acc: any) => sum + acc.balance, 0)

                                return (
                                    <div
                                        key={section}
                                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                                    >
                                        {/* Section Header */}
                                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                    <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <h2 className="font-bold text-slate-900 dark:text-white">
                                                        {section}
                                                    </h2>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {sectionAccounts.length}개 항목
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">소계</p>
                                                <p className="font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(sectionTotal)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Account List */}
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {sectionAccounts.map((account: any) => (
                                                <Link
                                                    key={account.id}
                                                    href={`/inventory/ledger/${account.id}`}
                                                    className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer block"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-slate-900 dark:text-white truncate">
                                                            {account.name}
                                                        </p>
                                                        {account.description && (
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                                                {account.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`font-bold ${account.balance >= 0
                                                            ? 'text-blue-600 dark:text-blue-400'
                                                            : 'text-red-600 dark:text-red-400'
                                                            }`}>
                                                            {formatCurrency(account.balance)}
                                                        </span>
                                                        <span className="text-slate-300 dark:text-slate-600">
                                                            &rsaquo;
                                                        </span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}
