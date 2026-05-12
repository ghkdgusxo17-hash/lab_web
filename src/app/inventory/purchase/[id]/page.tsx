import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout'
import { ChevronLeft, Clock, CheckCircle, XCircle, Package, User, FileText, Calendar, Wallet } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { PurchaseDeleteButton } from './PurchaseDeleteButton'

export const metadata: Metadata = {
    title: '구매 요청 상세 | CPE Lab',
    description: '구매 요청 상세 정보',
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0
    }).format(amount)
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

function getPriorityLabel(priority: string) {
    switch (priority) {
        case 'LOW': return { label: '낮음', color: 'text-slate-500' }
        case 'NORMAL': return { label: '보통', color: 'text-blue-600' }
        case 'HIGH': return { label: '높음', color: 'text-orange-600' }
        case 'URGENT': return { label: '긴급', color: 'text-red-600 font-bold' }
        default: return { label: priority, color: 'text-slate-500' }
    }
}

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function PurchaseRequestDetailPage({ params }: PageProps) {
    const { id } = await params
    const session = await auth()
    const userId = session?.user?.id
    const isAdmin = session?.user?.isAdmin

    const request = await prisma.purchaseRequest.findUnique({
        where: { id },
        include: {
            requester: {
                select: { id: true, name: true, image: true, email: true }
            },
            approver: {
                select: { id: true, name: true }
            },
            items: true
        }
    })

    if (!request) {
        notFound()
    }

    const status = getStatusInfo(request.status)
    const StatusIcon = status.icon
    const priority = getPriorityLabel(request.priority)
    const canDelete = isAdmin || request.requester?.id === userId

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Back Link */}
                    <Link
                        href="/inventory/purchase"
                        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 mb-6"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        구매 요청 목록
                    </Link>

                    {/* Header */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
                        <div className="p-6">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {request.title}
                                </h1>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.color}`}>
                                    <StatusIcon className="w-4 h-4" />
                                    {status.label}
                                </span>
                            </div>

                            {request.description && (
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    {request.description}
                                </p>
                            )}

                            {/* Meta Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">카테고리</p>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {getCategoryLabel(request.category)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">우선순위</p>
                                    <p className={`font-medium ${priority.color}`}>
                                        {priority.label}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">예상 비용</p>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {formatCurrency(request.estimatedCost)}
                                    </p>
                                </div>
                                {request.actualCost && (
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">실제 비용</p>
                                        <p className="font-medium text-green-600 dark:text-green-400">
                                            {formatCurrency(request.actualCost)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Requester */}
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {request.requester?.image ? (
                                    <Image
                                        src={request.requester.image}
                                        alt=""
                                        width={36}
                                        height={36}
                                        className="rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        {request.requester?.name || request.requesterName || '알 수 없음'}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        요청자
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {new Date(request.createdAt).toLocaleDateString('ko-KR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="font-bold text-slate-900 dark:text-white">구매 품목</h2>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {request.items.map((item, index) => (
                                <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                                            {index + 1}
                                        </span>
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className="text-slate-500 dark:text-slate-400">
                                        {item.quantity}개
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reject Reason */}
                    {request.rejectReason && (
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                            <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">반려 사유</p>
                            <p className="text-red-600 dark:text-red-300">{request.rejectReason}</p>
                        </div>
                    )}

                    {/* Approver Info */}
                    {(request.approver || request.approverName) && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {request.status === 'REJECTED' ? '반려' : '승인'}:
                                <span className="font-medium text-slate-700 dark:text-slate-300 ml-1">
                                    {request.approver?.name || request.approverName || '알 수 없음'}
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Attachment */}
                    {request.quotationUrl && (
                        <div className="mt-6">
                            <a
                                href={request.quotationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                견적서 보기
                            </a>
                        </div>
                    )}

                    {/* Delete Button */}
                    {canDelete && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <PurchaseDeleteButton
                                requestId={request.id}
                                isPurchased={!isAdmin && request.status === 'PURCHASED'}
                            />
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}
