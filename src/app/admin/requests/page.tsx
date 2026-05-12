import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout'
import {
    ShoppingCart,
    MessageCircleQuestion,
    UserPlus,
    ChevronRight,
    Clock,
    AlertTriangle,
    Settings
} from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '관리자 요청 | CPE Lab',
    description: '관리자 처리 대기 항목',
}

export default async function AdminRequestsPage() {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        redirect('/')
    }

    // Get pending counts
    const [
        pendingPurchases,
        pendingTasks,
        pendingUsers
    ] = await Promise.all([
        prisma.purchaseRequest.count({ where: { status: 'PENDING' } }),
        prisma.task.count({ where: { status: 'QUESTION' } }),
        prisma.user.count({ where: { isApproved: false } })
    ])

    const totalPending = pendingPurchases + pendingTasks + pendingUsers

    const requestItems = [
        {
            title: '구매요청 승인',
            description: '구매 요청을 검토하고 승인/반려합니다',
            icon: ShoppingCart,
            count: pendingPurchases,
            href: '/inventory/purchase?status=PENDING',
            color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
            borderColor: pendingPurchases > 0 ? 'border-orange-300 dark:border-orange-700' : ''
        },
        {
            title: '질문요청 답변',
            description: '멤버들의 질문에 답변합니다',
            icon: MessageCircleQuestion,
            count: pendingTasks,
            href: '/tasks?status=QUESTION',
            color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
            borderColor: pendingTasks > 0 ? 'border-purple-300 dark:border-purple-700' : ''
        },
        {
            title: '회원가입 승인',
            description: '새 회원 가입 요청을 승인합니다',
            icon: UserPlus,
            count: pendingUsers,
            href: '/admin/users',
            color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            borderColor: pendingUsers > 0 ? 'border-blue-300 dark:border-blue-700' : ''
        }
    ]

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                관리자 요청
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                처리가 필요한 요청을 확인합니다
                            </p>
                        </div>
                        <Link
                            href="/admin"
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <Settings className="w-4 h-4" />
                            관리자 설정
                        </Link>
                    </div>

                    {/* Summary Card */}
                    {totalPending > 0 ? (
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-red-700 dark:text-red-400">
                                        {totalPending}건의 처리 대기 항목이 있습니다
                                    </p>
                                    <p className="text-sm text-red-600/70 dark:text-red-400/70">
                                        아래 항목들을 확인해 주세요
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-2xl p-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                    <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-green-700 dark:text-green-400">
                                        모든 요청이 처리되었습니다
                                    </p>
                                    <p className="text-sm text-green-600/70 dark:text-green-400/70">
                                        현재 대기 중인 요청이 없습니다
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Request Items */}
                    <div className="space-y-4">
                        {requestItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className={`block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 ${item.borderColor} p-5 hover:shadow-lg transition-all group`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${item.color}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {item.title}
                                                </h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {item.count > 0 && (
                                                <span className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-bold rounded-full">
                                                    {item.count}건
                                                </span>
                                            )}
                                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </main>
        </>
    )
}
