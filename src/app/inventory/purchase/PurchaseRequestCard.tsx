'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, CheckCircle, XCircle, Package, AlertTriangle, ChevronRight, User } from 'lucide-react'
import { approvePurchaseRequest, rejectPurchaseRequest, startPurchase, markAsPurchased } from '@/actions/inventory'

interface PurchaseRequestCardProps {
    request: {
        id: string
        title: string
        description: string | null
        category: string
        priority: string
        estimatedCost: number
        actualCost: number | null
        status: string
        rejectReason: string | null
        createdAt: Date
        requesterName: string | null
        requester: {
            id: string
            name: string | null
            image: string | null
        } | null
        items: {
            id: string
            name: string
            quantity: number
        }[]
    }
    isAdmin: boolean
}

function getStatusInfo(status: string) {
    switch (status) {
        case 'PENDING':
            return { label: '대기중', icon: Clock, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
        case 'APPROVED':
            return { label: '승인됨', icon: CheckCircle, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
        case 'IN_PROGRESS':
            return { label: '구매진행', icon: Clock, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
        case 'REJECTED':
            return { label: '반려됨', icon: XCircle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
        case 'PURCHASED':
            return { label: '완료', icon: Package, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' }
        default:
            return { label: status, icon: Clock, color: 'bg-slate-100 text-slate-600' }
    }
}

function getCategoryLabel(category: string) {
    switch (category) {
        case 'REAGENT': return '시약'
        case 'EQUIPMENT': return '장비'
        case 'OFFICE': return '사무용품'
        case 'TRAVEL': return '출장'
        default: return '기타'
    }
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

export function PurchaseRequestCard({ request, isAdmin }: PurchaseRequestCardProps) {
    const [showActions, setShowActions] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [loading, setLoading] = useState(false)

    const statusInfo = getStatusInfo(request.status)
    const StatusIcon = statusInfo.icon

    async function handleApprove() {
        setLoading(true)
        const result = await approvePurchaseRequest(request.id)
        setLoading(false)
        if (result.error) alert(result.error)
        else setShowActions(false)
    }

    async function handleReject() {
        if (!rejectReason.trim()) {
            alert('반려 사유를 입력해주세요.')
            return
        }
        setLoading(true)
        const result = await rejectPurchaseRequest(request.id, rejectReason)
        setLoading(false)
        if (result.error) alert(result.error)
        else setShowActions(false)
    }

    async function handleStartPurchase() {
        setLoading(true)
        const result = await startPurchase(request.id)
        setLoading(false)
        if (result.error) alert(result.error)
    }

    async function handleComplete() {
        setLoading(true)
        const result = await markAsPurchased(request.id, request.actualCost || request.estimatedCost)
        setLoading(false)
        if (result.error) alert(result.error)
    }

    return (
        <div className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${request.priority === 'URGENT' ? 'border-l-4 border-l-red-500' : ''
            }`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        {request.priority === 'URGENT' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                <AlertTriangle className="w-3 h-3" />
                                긴급
                            </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${statusInfo.color}`}>
                            {statusInfo.label}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {getCategoryLabel(request.category)}
                        </span>
                    </div>

                    <Link href={`/inventory/purchase/${request.id}`} className="group">
                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {request.title}
                        </h3>
                    </Link>

                    {request.items.length > 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">
                            {request.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-2">
                            {request.requester?.image ? (
                                <Image
                                    src={request.requester.image}
                                    alt=""
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <User className="w-3 h-3 text-slate-400" />
                                </div>
                            )}
                            <span className="text-slate-600 dark:text-slate-400">
                                {request.requester?.name || request.requesterName || '알 수 없음'}
                            </span>
                        </div>
                        <span className="text-slate-400">
                            {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                    </div>

                    {request.rejectReason && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/10 rounded text-sm text-red-600 dark:text-red-400">
                            반려 사유: {request.rejectReason}
                        </div>
                    )}
                </div>

                <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {formatCurrency(request.actualCost || request.estimatedCost)}
                    </p>
                    {request.actualCost && request.actualCost !== request.estimatedCost && (
                        <p className="text-xs text-slate-400 line-through">
                            {formatCurrency(request.estimatedCost)}
                        </p>
                    )}
                </div>
            </div>

            {/* Admin Actions */}
            {isAdmin && request.status === 'PENDING' && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {!showActions ? (
                        <button
                            onClick={() => setShowActions(true)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            승인/반려
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={handleApprove}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {loading ? '처리중...' : '승인'}
                                </button>
                                <button
                                    onClick={() => setShowActions(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
                                >
                                    취소
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="반려 사유"
                                    className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                                />
                                <button
                                    onClick={handleReject}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    반려
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* APPROVED → IN_PROGRESS */}
            {isAdmin && request.status === 'APPROVED' && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={handleStartPurchase}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? '처리중...' : '구매 진행 시작'}
                    </button>
                </div>
            )}

            {/* IN_PROGRESS → PURCHASED */}
            {isAdmin && request.status === 'IN_PROGRESS' && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={handleComplete}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? '처리중...' : '구매 완료'}
                    </button>
                </div>
            )}
        </div>
    )
}
