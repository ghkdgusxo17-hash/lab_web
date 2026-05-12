import { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { ArrowLeft, Package, Beaker, Box, Wrench, MapPin, Calendar, FileText, Edit, Trash2, Plus, Minus } from 'lucide-react'
import { getInventoryItem, deleteInventoryItem } from '@/actions/inventory'
import { InventoryTransactionList } from './InventoryTransactionList'
import { InventoryDeleteButton } from './InventoryDeleteButton'

export const dynamic = 'force-dynamic'

interface InventoryItemDetailPageProps {
    params: Promise<{ id: string }>
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

export async function generateMetadata({ params }: InventoryItemDetailPageProps): Promise<Metadata> {
    const { id } = await params
    const item = await getInventoryItem(id)
    return {
        title: item ? `${item.name} | CPE Lab` : '품목 상세',
    }
}

export default async function InventoryItemDetailPage({ params }: InventoryItemDetailPageProps) {
    const { id } = await params
    const session = await auth()
    const item = await getInventoryItem(id)

    if (!item) {
        notFound()
    }

    const isAdmin = session?.user?.isAdmin
    const categoryInfo = getCategoryInfo(item.category)
    const Icon = categoryInfo.icon
    const isLowStock = item.minQuantity > 0 && item.quantity <= item.minQuantity
    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date()

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            href="/inventory/items"
                            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            목록으로
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className={`p-4 rounded-2xl ${categoryInfo.color}`}>
                                    <Icon className="w-8 h-8" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${categoryInfo.color}`}>
                                            {categoryInfo.label}
                                        </span>
                                        {isLowStock && (
                                            <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                재고 부족
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                        {item.name}
                                    </h1>
                                    {item.manufacturer && (
                                        <p className="text-slate-500 mt-1">{item.manufacturer}</p>
                                    )}
                                </div>
                            </div>

                            {(isAdmin || session?.user?.isApproved) && (
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/inventory/items/${id}/edit`}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        수정
                                    </Link>
                                    <InventoryDeleteButton itemId={id} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Stock Info Card */}
                            <div className={`bg-white dark:bg-slate-900 rounded-2xl border p-6 ${isLowStock ? 'border-red-200 dark:border-red-800' : 'border-slate-200 dark:border-slate-800'
                                }`}>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">재고 현황</h2>
                                <div className="flex items-center gap-8">
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">현재 수량</p>
                                        <p className={`text-4xl font-bold ${isLowStock ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                                            {item.quantity} <span className="text-lg font-normal text-slate-500">{item.unit}</span>
                                        </p>
                                    </div>
                                    {item.minQuantity > 0 && (
                                        <div>
                                            <p className="text-sm text-slate-500 mb-1">최소 재고량</p>
                                            <p className="text-2xl font-bold text-slate-400">
                                                {item.minQuantity} <span className="text-lg font-normal">{item.unit}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Transaction History */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">입출고 기록</h2>
                                <InventoryTransactionList transactions={item.transactions} unit={item.unit} />
                            </div>
                        </div>

                        {/* Side Info */}
                        <div className="space-y-6">
                            {/* Details Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">상세 정보</h2>
                                <div className="space-y-4">
                                    {item.location && (
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-slate-500">보관 위치</p>
                                                <p className="font-medium text-slate-900 dark:text-white">{item.location}</p>
                                            </div>
                                        </div>
                                    )}
                                    {item.expiryDate && (
                                        <div className="flex items-start gap-3">
                                            <Calendar className={`w-5 h-5 mt-0.5 ${isExpired ? 'text-red-500' : 'text-slate-400'}`} />
                                            <div>
                                                <p className="text-sm text-slate-500">유효기간</p>
                                                <p className={`font-medium ${isExpired ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                                                    {new Date(item.expiryDate).toLocaleDateString('ko-KR')}
                                                    {isExpired && ' (만료됨)'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {item.catalogNo && (
                                        <div>
                                            <p className="text-sm text-slate-500">카탈로그 번호</p>
                                            <p className="font-medium text-slate-900 dark:text-white">{item.catalogNo}</p>
                                        </div>
                                    )}
                                    {item.msdsUrl && (
                                        <div className="flex items-start gap-3">
                                            <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-slate-500">MSDS</p>
                                                <a
                                                    href={item.msdsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    다운로드
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {item.notes && (
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">비고</h2>
                                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{item.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
