import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { ArrowLeft } from 'lucide-react'
import { WorkspaceForm } from './WorkspaceForm'

export const metadata: Metadata = {
    title: '새 협업공간 | CPE Lab',
    description: '새 협업공간 생성',
}

export default async function NewWorkspacePage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/api/auth/signin')
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        redirect('/workspaces')
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-2xl mx-auto">
                    {/* Back button */}
                    <Link
                        href="/workspaces"
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        목록으로
                    </Link>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            새 협업공간
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            팀원들과 자료를 공유할 협업공간을 만드세요
                        </p>
                    </div>

                    {/* Form */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
                        <WorkspaceForm />
                    </div>
                </div>
            </main>
        </>
    )
}
