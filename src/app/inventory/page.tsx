import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { Package, ShoppingCart, BookOpen, AlertTriangle, Wallet } from 'lucide-react'
import { getInventoryItems, getLowStockItems, getPurchaseRequests, getLedgerSummary } from '@/actions/inventory'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '자원관리 | CPE Lab',
    description: '연구실 시약, 소모품, 예산 관리',
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0
    }).format(amount)
}

export default async function InventoryPage() {
    const session = await auth()
    const isLoggedIn = !!session?.user
    const isAdmin = session?.user?.isAdmin

    // Get summary data
    const [items, lowStockItems, pendingRequests, summary] = await Promise.all([
        getInventoryItems(),
        getLowStockItems(),
        getPurchaseRequests('PENDING'),
        getLedgerSummary()
    ])

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                자원관리
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                시약, 소모품 및 예산을 관리합니다
                            </p>
                        </div>
                    </div>

                    {!isLoggedIn ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                            <Package className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                로그인이 필요합니다
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                자원관리 기능은 연구실 멤버만 이용할 수 있습니다
                            </p>
                            <Link href="/login" className="btn-primary px-6 py-2.5 text-white">
                                로그인하기
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {/* Total Items */}
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="text-sm text-slate-500 dark:text-slate-400">총 품목</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {items.length}개
                                    </p>
                                </div>

                                {/* Low Stock Warning */}
                                <div className={`bg-white dark:bg-slate-900 rounded-xl border p-5 ${lowStockItems.length > 0
                                    ? 'border-red-200 dark:border-red-800'
                                    : 'border-slate-200 dark:border-slate-800'
                                    }`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-2 rounded-lg ${lowStockItems.length > 0
                                            ? 'bg-red-100 dark:bg-red-900/30'
                                            : 'bg-slate-100 dark:bg-slate-800'
                                            }`}>
                                            <AlertTriangle className={`w-5 h-5 ${lowStockItems.length > 0
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-slate-400'
                                                }`} />
                                        </div>
                                        <span className="text-sm text-slate-500 dark:text-slate-400">재고 부족</span>
                                    </div>
                                    <p className={`text-2xl font-bold ${lowStockItems.length > 0
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-slate-900 dark:text-white'
                                        }`}>
                                        {lowStockItems.length}개
                                    </p>
                                </div>

                                {/* Pending Requests */}
                                <div className={`bg-white dark:bg-slate-900 rounded-xl border p-5 ${pendingRequests.length > 0
                                    ? 'border-yellow-200 dark:border-yellow-800'
                                    : 'border-slate-200 dark:border-slate-800'
                                    }`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-2 rounded-lg ${pendingRequests.length > 0
                                            ? 'bg-yellow-100 dark:bg-yellow-900/30'
                                            : 'bg-slate-100 dark:bg-slate-800'
                                            }`}>
                                            <ShoppingCart className={`w-5 h-5 ${pendingRequests.length > 0
                                                ? 'text-yellow-600 dark:text-yellow-400'
                                                : 'text-slate-400'
                                                }`} />
                                        </div>
                                        <span className="text-sm text-slate-500 dark:text-slate-400">승인 대기</span>
                                    </div>
                                    <p className={`text-2xl font-bold ${pendingRequests.length > 0
                                        ? 'text-yellow-600 dark:text-yellow-400'
                                        : 'text-slate-900 dark:text-white'
                                        }`}>
                                        {pendingRequests.length}건
                                    </p>
                                </div>

                                {/* Monthly Balance */}
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                            <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <span className="text-sm text-slate-500 dark:text-slate-400">총 잔액</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {formatCurrency(summary.totalBalance)}
                                    </p>
                                </div>
                            </div>

                            {/* Quick Navigation Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Inventory Items */}
                                <Link
                                    href="/inventory/items"
                                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-lg"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
                                            <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                시약/소모품
                                            </h3>
                                            <p className="text-sm text-slate-500">재고 및 입출고 관리</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">등록된 품목</span>
                                        <span className="font-bold text-blue-600 dark:text-blue-400">{items.length}개</span>
                                    </div>
                                    {lowStockItems.length > 0 && (
                                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>{lowStockItems.length}개 품목 재고 부족</span>
                                        </div>
                                    )}
                                </Link>

                                {/* Purchase Requests */}
                                <Link
                                    href="/inventory/purchase"
                                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-orange-300 dark:hover:border-orange-700 transition-all hover:shadow-lg"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl group-hover:scale-110 transition-transform">
                                            <ShoppingCart className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                구매 요청
                                            </h3>
                                            <p className="text-sm text-slate-500">물품 구매 신청</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">승인 대기</span>
                                        <span className="font-bold text-orange-600 dark:text-orange-400">
                                            {pendingRequests.length}건
                                        </span>
                                    </div>
                                </Link>

                                {/* Ledger */}
                                <Link
                                    href="/inventory/ledger"
                                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-green-300 dark:hover:border-green-700 transition-all hover:shadow-lg"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl group-hover:scale-110 transition-transform">
                                            <BookOpen className="w-8 h-8 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                장부
                                            </h3>
                                            <p className="text-sm text-slate-500">잔액 관리</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 flex items-center gap-1">
                                            <Wallet className="w-3 h-3 text-blue-500" />
                                            총 잔액
                                        </span>
                                        <span className="font-bold text-blue-600">{formatCurrency(summary.totalBalance)}</span>
                                    </div>
                                </Link>
                            </div>

                            {/* Low Stock Warning Section */}
                            {lowStockItems.length > 0 && (
                                <div className="mt-8 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-5">
                                    <h3 className="font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        재고 부족 품목
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {lowStockItems.slice(0, 6).map((item: any) => (
                                            <Link
                                                key={item.id}
                                                href={`/inventory/items/${item.id}`}
                                                className="bg-white dark:bg-slate-900 rounded-lg p-3 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <span className="font-medium text-slate-900 dark:text-white truncate">
                                                    {item.name}
                                                </span>
                                                <span className="text-sm text-red-600 dark:text-red-400 font-bold ml-2">
                                                    {item.quantity}/{item.minQuantity} {item.unit}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                    {lowStockItems.length > 6 && (
                                        <Link
                                            href="/inventory/items?filter=low"
                                            className="mt-3 inline-block text-sm text-red-600 dark:text-red-400 hover:underline"
                                        >
                                            +{lowStockItems.length - 6}개 더 보기
                                        </Link>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </>
    )
}
