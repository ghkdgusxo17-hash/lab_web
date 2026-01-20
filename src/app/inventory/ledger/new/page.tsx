import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout'
import { ChevronLeft } from 'lucide-react'
import { LedgerAccountForm } from '../LedgerAccountForm'
import { getLedgerSections } from '@/actions/inventory'

export const metadata: Metadata = {
    title: '항목 추가 | CPE Lab',
    description: '새 항목 추가',
}

export default async function NewLedgerAccountPage() {
    const session = await auth()

    if (!session?.user?.isAdmin && !session?.user?.isApproved) {
        redirect('/inventory/ledger')
    }

    const sectionsData = await getLedgerSections()
    const existingSections = sectionsData.map(s => s.section)

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-xl mx-auto">
                    <Link
                        href="/inventory/ledger"
                        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 mb-6"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        장부로 돌아가기
                    </Link>

                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
                        항목 추가
                    </h1>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <LedgerAccountForm existingSections={existingSections} />
                    </div>
                </div>
            </main>
        </>
    )
}
