import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { UsefulLinkForm } from './UsefulLinkForm'

export const metadata: Metadata = {
    title: 'Useful Link 업로드 | CPE Lab',
    description: '연구실 구성원이 함께 볼 사이트를 Useful Links에 추가합니다.',
}

export default async function NewUsefulLinkPage() {
    const session = await auth()
    const isLocalPreview = process.env.LOCAL_SKIP_AUTH === 'true' && process.env.NODE_ENV !== 'production'

    if (!session?.user?.isAdmin && !session?.user?.isApproved) {
        redirect('/board/folder')
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                            Useful Link 업로드
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            연구실 사람들이 함께 보면 좋은 사이트를 추가합니다.
                        </p>
                    </div>

                    <UsefulLinkForm
                        currentUserId={session.user.id}
                        currentUserName={session.user.name || null}
                        isLocalPreview={isLocalPreview}
                    />
                </div>
            </main>
        </>
    )
}
