import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { getLabMembers } from '@/actions/paper'
import { ArrowLeft } from 'lucide-react'
import { LabPaperForm } from './LabPaperForm'

export const metadata: Metadata = { title: '논문 등록 | CPE Lab' }

export default async function NewLabPaperPage() {
    const session = await auth()
    if (!session?.user?.isApproved && !session?.user?.isAdmin) redirect('/materials/paper/lab')

    const members = await getLabMembers()

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-2xl mx-auto">
                    <Link href="/materials/paper/lab" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Lab Papers
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">논문 등록</h1>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                        <LabPaperForm members={members} />
                    </div>
                </div>
            </main>
        </>
    )
}
