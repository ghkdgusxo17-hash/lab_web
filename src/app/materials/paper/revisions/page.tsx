import { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout'
import { getLabPapers } from '@/actions/paper'
import { ArrowLeft, RotateCcw, ChevronRight, FolderOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Revisions | CPE Lab' }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    WRITING:      { label: '작성중', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    SUBMITTED:    { label: '투고',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    UNDER_REVIEW: { label: '심사중', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    REVISION:     { label: 'Revisions', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    ACCEPTED:     { label: '수락',   color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    PUBLISHED:    { label: '게재',   color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
}

export default async function RevisionsPage() {
    const papers = await getLabPapers()

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <Link href="/materials/paper" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        논문
                    </Link>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                            <RotateCcw className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">Revisions</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">논문을 선택하면 Revisions을 추가할 수 있습니다</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {papers.length === 0 ? (
                            <div className="py-16 text-center">
                                <FolderOpen className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400">등록된 논문이 없습니다</p>
                                <Link href="/materials/paper/lab/new" className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                                    논문 먼저 등록하기 →
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {papers.map(paper => {
                                    const status = STATUS_MAP[paper.status] ?? STATUS_MAP.WRITING
                                    return (
                                        <Link
                                            key={paper.id}
                                            href={`/materials/paper/lab/${paper.id}`}
                                            className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                                                <RotateCcw className="w-4 h-4 text-orange-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        Revisions {paper.revisions.length}개
                                                    </span>
                                                </div>
                                                <p className="font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400">
                                                    {paper.title}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 flex-shrink-0" />
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
