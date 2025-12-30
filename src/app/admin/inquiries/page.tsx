import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout'
import { ChevronLeft, Mail, Clock, CheckCircle, Trash2 } from 'lucide-react'
import { getInquiries } from '@/actions/contact'
import { InquiryManager } from '@/components/admin/InquiryManager'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '문의 관리 | CPE Lab',
    description: '외부 문의 관리',
}

export default async function InquiriesPage() {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        redirect('/')
    }

    const inquiryResult = await getInquiries()
    const inquiries = inquiryResult.inquiries || []
    const pendingCount = inquiries.filter((i: any) => i.status === 'PENDING').length
    const resolvedCount = inquiries.filter((i: any) => i.status === 'RESOLVED').length

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Back Link */}
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 mb-6"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        관리자 설정
                    </Link>

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                문의 관리
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                외부에서 접수된 문의를 관리합니다
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingCount}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">대기 중</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{resolvedCount}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">처리 완료</p>
                            </div>
                        </div>
                    </div>

                    {/* Inquiry Manager */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {inquiries.length > 0 ? (
                            <InquiryManager inquiries={inquiries} />
                        ) : (
                            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                                <Mail className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                                접수된 문의가 없습니다
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    )
}
