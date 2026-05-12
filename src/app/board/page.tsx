import { Metadata } from 'next'
import Link from 'next/link'
import { getPosts } from '@/actions/board'
import { Navbar } from '@/components/layout'
import { Plus, Megaphone, MessageSquare, BookOpen, Pin } from 'lucide-react'
import { auth } from "@/auth"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '게시판 | CPE Lab',
    description: '연구실 공지사항과 자유게시판입니다.',
}

interface Post {
    id: string
    title: string
    content: string
    type: string
    isPinned: boolean
    createdAt: Date
    author: {
        id: string
        name: string | null
        image: string | null
    }
}

interface BoardPageProps {
    searchParams: Promise<{ type?: string }>
}

const BOARD_TYPES = [
    { key: '', label: '전체', icon: null },
    { key: 'NOTICE', label: '공지사항', icon: Megaphone, color: 'text-red-600' },
    { key: 'SEMINAR', label: '세미나', icon: BookOpen, color: 'text-purple-600' },
    { key: 'FREE', label: '자유게시판', icon: MessageSquare, color: 'text-blue-600' },
]

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).replace(/\. /g, '.').replace(/\.$/, '')
}

function getTypeLabel(type: string) {
    switch (type) {
        case 'NOTICE': return { label: '공지', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' }
        case 'SEMINAR': return { label: '세미나', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' }
        default: return { label: '자유', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' }
    }
}

export default async function BoardPage({ searchParams }: BoardPageProps) {
    const params = await searchParams
    const session = await auth()
    const isAdmin = session?.user?.isAdmin
    const isApproved = session?.user?.isApproved
    const canWrite = isAdmin || isApproved

    const type = params.type || ''
    const posts = await getPosts(type || undefined)

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                게시판
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                연구실 소식과 정보를 공유하는 공간입니다
                            </p>
                        </div>
                        {canWrite && (
                            <Link
                                href="/board/write"
                                className="btn-primary px-5 py-2.5 text-white text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                글쓰기
                            </Link>
                        )}
                    </div>

                    {/* Board Container */}
                    <div className="bg-white dark:bg-slate-900 t-rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            {BOARD_TYPES.map((t) => (
                                <Link
                                    key={t.key}
                                    href={t.key ? `/board?type=${t.key}` : '/board'}
                                    className={`px-6 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${type === t.key
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {t.label}
                                </Link>
                            ))}
                        </div>

                        {/* Table Header */}
                        <div className="grid grid-cols-[60px_1fr_100px_100px] md:grid-cols-[80px_1fr_120px_120px] items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <div className="text-center">번호</div>
                            <div>제목</div>
                            <div className="text-center">작성자</div>
                            <div className="text-center">날짜</div>
                        </div>

                        {/* Posts */}
                        {posts.length === 0 ? (
                            <div className="py-16 text-center">
                                <MessageSquare className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400">게시글이 없습니다</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {posts.map((post, index) => {
                                    const typeLabel = getTypeLabel(post.type)
                                    return (
                                        <Link
                                            key={post.id}
                                            href={`/board/${post.id}`}
                                            className="grid grid-cols-[60px_1fr_100px_100px] md:grid-cols-[80px_1fr_120px_120px] items-center px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                        >
                                            {/* Number */}
                                            <div className="text-center text-sm text-slate-400 dark:text-slate-500">
                                                {post.isPinned ? (
                                                    <Pin className="w-4 h-4 text-amber-500 mx-auto" />
                                                ) : (
                                                    posts.length - index
                                                )}
                                            </div>

                                            {/* Title */}
                                            <div className="flex items-center gap-2 min-w-0">
                                                {!type && (
                                                    <span className={`px-2 py-0.5 text-xs font-bold t-rounded-sm ${typeLabel.color} flex-shrink-0`}>
                                                        {typeLabel.label}
                                                    </span>
                                                )}
                                                <span className="font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {post.title}
                                                </span>
                                            </div>

                                            {/* Author */}
                                            <div className="text-center text-sm text-slate-500 dark:text-slate-400 truncate">
                                                {post.author.name || '익명'}
                                            </div>

                                            {/* Date */}
                                            <div className="text-center text-sm text-slate-400 dark:text-slate-500">
                                                {formatDate(post.createdAt)}
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    )
}
