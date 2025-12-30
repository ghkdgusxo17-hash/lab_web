import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { Package, Plus, Search, AlertTriangle, Beaker, Box, Wrench, MoreHorizontal } from 'lucide-react'
import { getInventoryItems, getLowStockItems } from '@/actions/inventory'
import { InventorySearch } from './InventorySearch'
import { InventoryItemCard } from './InventoryItemCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '시약/소모품 | CPE Lab',
    description: '연구실 시약 및 소모품 재고 관리',
}

const CATEGORIES = [
    { key: '', label: '전체', icon: Package },
    { key: 'REAGENT', label: '시약', icon: Beaker },
    { key: 'CONSUMABLE', label: '소모품', icon: Box },
    { key: 'EQUIPMENT', label: '장비', icon: Wrench },
    { key: 'OTHER', label: '기타', icon: MoreHorizontal },
]

interface InventoryItemsPageProps {
    searchParams: Promise<{ category?: string; search?: string; filter?: string }>
}

export default async function InventoryItemsPage({ searchParams }: InventoryItemsPageProps) {
    const { category, search, filter } = await searchParams
    const session = await auth()
    const isAdmin = session?.user?.isAdmin
    const canRecord = session?.user?.isApproved || session?.user?.isAdmin

    let items = await getInventoryItems(category || undefined, search || undefined)

    // Filter for low stock if requested
    if (filter === 'low') {
        items = items.filter((item: any) => item.quantity <= item.minQuantity && item.minQuantity > 0)
    }

    const lowStockItems = await getLowStockItems()
    const currentCategory = category || ''

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                                <Link href="/inventory" className="hover:text-blue-600">자원관리</Link>
                                <span>/</span>
                                <span>시약/소모품</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                시약/소모품
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                연구실 재고를 관리합니다
                            </p>
                        </div>
                        {(isAdmin || session?.user?.isApproved) && (
                            <Link
                                href="/inventory/items/new"
                                className="btn-primary px-5 py-2.5 text-white text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                품목 등록
                            </Link>
                        )}
                    </div>

                    {/* Low Stock Warning */}
                    {lowStockItems.length > 0 && filter !== 'low' && (
                        <Link
                            href="/inventory/items?filter=low"
                            className="mb-6 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            <span className="text-red-700 dark:text-red-400 font-medium">
                                {lowStockItems.length}개 품목의 재고가 부족합니다
                            </span>
                        </Link>
                    )}

                    {/* Board Container */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Tabs and Search */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pr-4">
                            {/* Category Tabs */}
                            <div className="flex overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {CATEGORIES.map((cat) => {
                                    const Icon = cat.icon
                                    return (
                                        <Link
                                            key={cat.key}
                                            href={`/inventory/items?category=${cat.key}${search ? `&search=${search}` : ''}${filter ? `&filter=${filter}` : ''}`}
                                            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${currentCategory === cat.key
                                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {cat.label}
                                        </Link>
                                    )
                                })}
                            </div>

                            {/* Search */}
                            <div className="py-2">
                                <InventorySearch
                                    currentSearch={search || ''}
                                    currentCategory={currentCategory}
                                    currentFilter={filter || ''}
                                />
                            </div>
                        </div>

                        {/* Items Grid */}
                        {items.length === 0 ? (
                            <div className="py-16 text-center">
                                <Package className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400">
                                    {filter === 'low' ? '재고 부족 품목이 없습니다' : '등록된 품목이 없습니다'}
                                </p>
                                {(isAdmin || session?.user?.isApproved) && !filter && (
                                    <Link
                                        href="/inventory/items/new"
                                        className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                                    >
                                        <Plus className="w-4 h-4" />
                                        첫 품목 등록하기
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                {items.map((item: any) => (
                                    <InventoryItemCard
                                        key={item.id}
                                        item={item}
                                        canRecord={!!canRecord}
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
