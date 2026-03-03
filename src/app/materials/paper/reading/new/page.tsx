import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { ArrowLeft } from 'lucide-react'
import { ReadingPaperForm } from './ReadingPaperForm'

export const metadata: Metadata = { title: 'Paper Reading 등록 | CPE Lab' }

export default async function NewReadingPaperPage() {
    const session = await auth()
    if (!session?.user?.isApproved && !session?.user?.isAdmin) redirect('/materials/paper/reading')

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-2xl mx-auto">
                    <Link href="/materials/paper/reading" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Paper Reading
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Paper Reading 등록</h1>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                        <ReadingPaperForm />
                    </div>
                </div>
            </main>
        </>
    )
}
