import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { Navbar } from '@/components/layout'
import { ChevronLeft } from 'lucide-react'
import { LedgerAccountEditForm } from '../../LedgerAccountEditForm'
import { prisma } from '@/lib/prisma'
import { getLedgerSections } from '@/actions/inventory'

export const metadata: Metadata = {
    title: '항목 수정 | CPE Lab',
    description: '장부 항목 수정',
}

interface EditPageProps {
    params: Promise<{ id: string }>
}

export default async function EditLedgerAccountPage({ params }: EditPageProps) {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.isAdmin && !session?.user?.isApproved) {
        redirect('/inventory/ledger')
    }

    const account = await prisma.ledgerAccount.findUnique({
        where: { id }
    })

    const sectionsData = await getLedgerSections()
    const existingSections = sectionsData.map(s => s.section)

    if (!account) {
        notFound()
    }

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
                        항목 수정
                    </h1>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <LedgerAccountEditForm account={account} existingSections={existingSections} />
                    </div>
                </div>
            </main>
        </>
    )
}
