import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { PostForm } from './PostForm'

export const metadata: Metadata = {
    title: '글쓰기 | CPE Lab',
}

export default async function WritePage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    // Guest users cannot write
    if (!session.user.isApproved && !session.user.isAdmin) {
        redirect('/board')
    }

    const isAdmin = session.user.isAdmin

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
                        새 글 작성
                    </h1>
                    <PostForm isAdmin={isAdmin} />
                </div>
            </main>
        </>
    )
}
