import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { MaterialUploadForm } from './MaterialUploadForm'

export const metadata: Metadata = {
    title: '자료 업로드 | CPE Lab',
    description: '연구 자료 업로드',
}

export default async function MaterialUploadPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/api/auth/signin')
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        redirect('/materials')
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-2xl mx-auto">
                    {/* Back button */}
                    <Link
                        href="/materials"
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        목록으로
                    </Link>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            자료 업로드
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            연구 자료를 공유해 주세요
                        </p>
                    </div>

                    {/* Upload Form */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
                        <MaterialUploadForm />
                    </div>
                </div>
            </main>
        </>
    )
}
