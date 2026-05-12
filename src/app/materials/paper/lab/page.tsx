import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { getLabPapers } from '@/actions/paper'
import { FileText, ArrowLeft, Plus, FolderOpen, Paperclip } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Lab Papers | CPE Lab',
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    WRITING:      { label: '작성중',  color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    SUBMITTED:    { label: '투고',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    UNDER_REVIEW: { label: '심사중',  color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    REVISION:     { label: '리비전',  color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    ACCEPTED:     { label: '수락',    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    PUBLISHED:    { label: '게재',    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
}

export default async function LabPaperListPage() {
    const session = await auth()
    const papers = await getLabPapers()
    const canWrite = session?.user?.isApproved || session?.user?.isAdmin

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <Link href="/materials/paper" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                                논문
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                                    Lab Papers
                                </h1>
                            </div>
                        </div>
                        {canWrite && (
                            <Link href="/materials/paper/lab/new" className="btn-primary px-5 py-2.5 text-white text-sm">
                                <Plus className="w-4 h-4" />
                                논문 등록
                            </Link>
                        )}
                    </div>

                    {/* List */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {papers.length === 0 ? (
                            <div className="py-16 text-center">
                                <FolderOpen className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400">등록된 논문이 없습니다</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {papers.map((paper) => {
                                    const status = STATUS_MAP[paper.status] ?? STATUS_MAP.WRITING
                                    return (
                                        <Link
                                            key={paper.id}
                                            href={`/materials/paper/lab/${paper.id}`}
                                            className="flex items-start gap-4 px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                    {paper.journal && (
                                                        <span className="text-xs text-slate-400">{paper.journal}</span>
                                                    )}
                                                    {paper.year && (
                                                        <span className="text-xs text-slate-400">{paper.year}</span>
                                                    )}
                                                </div>
                                                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                                    {paper.title}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                    <div className="flex items-center gap-1">
                                                        {paper.authors.slice(0, 4).map((a) => (
                                                            <span key={a.id} className="text-xs text-slate-500 dark:text-slate-400">
                                                                {a.user.name}
                                                            </span>
                                                        ))}
                                                        {paper.authors.length > 4 && (
                                                            <span className="text-xs text-slate-400">외 {paper.authors.length - 4}명</span>
                                                        )}
                                                    </div>
                                                    {paper.filename && (
                                                        <span className="inline-flex items-center gap-0.5 text-xs text-blue-500">
                                                            <Paperclip className="w-3 h-3" /> 파일
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-400">
                                                        리비전 {paper.revisions.length}개
                                                    </span>
                                                </div>
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
