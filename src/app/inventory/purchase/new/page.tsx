import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { ArrowLeft } from 'lucide-react'
import { PurchaseRequestForm } from '../PurchaseRequestForm'

export const metadata: Metadata = {
    title: '구매 요청 | CPE Lab',
    description: '새 구매 요청',
}

export default async function NewPurchaseRequestPage() {
    const session = await auth()

    if (!session?.user?.isApproved && !session?.user?.isAdmin) {
        redirect('/inventory/purchase')
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            href="/inventory/purchase"
                            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            목록으로
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            구매 요청
                        </h1>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <PurchaseRequestForm />
                    </div>
                </div>
            </main>
        </>
    )
}
