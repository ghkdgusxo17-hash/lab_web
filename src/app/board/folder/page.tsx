import { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Folder, Megaphone, MessageSquare, Plus } from 'lucide-react'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { getUsefulLinks } from '@/actions/useful-link'
import { UsefulLinksClient } from './UsefulLinksClient'

export const metadata: Metadata = {
    title: 'Useful Links | CPE Lab',
    description: '연구실 구성원이 함께 보면 좋은 사이트를 공유하는 공간입니다.',
}

const BOARD_LINKS = [
    { href: '/board', label: '전체', icon: null },
    { href: '/board?type=NOTICE', label: '공지사항', icon: Megaphone },
    { href: '/board?type=SEMINAR', label: '세미나', icon: BookOpen },
    { href: '/board?type=FREE', label: '자유게시판', icon: MessageSquare },
    { href: '/board/folder', label: 'Useful Links', icon: Folder },
]

export default async function BoardFolderPage() {
    const session = await auth()
    const canWrite = session?.user?.isAdmin || session?.user?.isApproved
    const links = await getUsefulLinks()
    const isLocalPreview = process.env.LOCAL_SKIP_AUTH === 'true' && process.env.NODE_ENV !== 'production'

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                Useful Links
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                연구실 사람들이 함께 보면 좋은 사이트를 모아두는 공간입니다.
                            </p>
                        </div>
                        {canWrite && (
                            <a
                                href="/board/folder/new"
                                className="btn-primary px-5 py-2.5 text-white text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                링크 추가
                            </a>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-900 t-rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            {BOARD_LINKS.map((link) => {
                                const Icon = link.icon

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`px-6 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${link.href === '/board/folder'
                                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            {Icon && <Icon className="w-4 h-4" />}
                                            {link.label}
                                        </span>
                                    </Link>
                                )
                            })}
                        </div>

                        <UsefulLinksClient
                            initialLinks={links}
                            currentUserId={session?.user?.id}
                            isAdmin={Boolean(session?.user?.isAdmin)}
                            isLocalPreview={isLocalPreview}
                        />
                    </div>
                </div>
            </main>
        </>
    )
}
