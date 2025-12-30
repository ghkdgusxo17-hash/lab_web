import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { ShoppingCart, Plus, Clock, CheckCircle, XCircle, Package } from 'lucide-react'
import { getPurchaseRequests } from '@/actions/inventory'
import { PurchaseRequestCard } from './PurchaseRequestCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '구매 요청 | CPE Lab',
    description: '물품 구매 요청 관리',
}

const STATUS_TABS = [
    { key: '', label: '전체', icon: ShoppingCart },
    { key: 'PENDING', label: '대기중', icon: Clock },
    { key: 'APPROVED', label: '승인됨', icon: CheckCircle },
    { key: 'IN_PROGRESS', label: '구매진행', icon: ShoppingCart },
    { key: 'REJECTED', label: '반려됨', icon: XCircle },
    { key: 'PURCHASED', label: '완료', icon: Package },
]

interface PurchasePageProps {
    searchParams: Promise<{ status?: string; category?: string }>
}

export default async function PurchasePage({ searchParams }: PurchasePageProps) {
    const { status, category } = await searchParams
    const session = await auth()
    const isAdmin = session?.user?.isAdmin
    const canRequest = session?.user?.isApproved || session?.user?.isAdmin

    const requests = await getPurchaseRequests(status || undefined, category || undefined)
    const currentStatus = status || ''

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
                                <span>구매 요청</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                구매 요청
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                물품 구매를 신청하고 관리합니다
                            </p>
                        </div>
                        {canRequest && (
                            <Link
                                href="/inventory/purchase/new"
                                className="btn-primary px-5 py-2.5 text-white text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                구매 요청
                            </Link>
                        )}
                    </div>

                    {/* Board Container */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Status Tabs */}
                        <div className="flex overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            {STATUS_TABS.map((tab) => {
                                const Icon = tab.icon
                                return (
                                    <Link
                                        key={tab.key}
                                        href={`/inventory/purchase?status=${tab.key}${category ? `&category=${category}` : ''}`}
                                        className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${currentStatus === tab.key
                                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </Link>
                                )
                            })}
                        </div>

                        {/* Requests List */}
                        {requests.length === 0 ? (
                            <div className="py-16 text-center">
                                <ShoppingCart className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400">구매 요청이 없습니다</p>
                                {canRequest && (
                                    <Link
                                        href="/inventory/purchase/new"
                                        className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                                    >
                                        <Plus className="w-4 h-4" />
                                        첫 구매 요청하기
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {requests.map((request: any) => (
                                    <PurchaseRequestCard
                                        key={request.id}
                                        request={request}
                                        isAdmin={!!isAdmin}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    )
}
