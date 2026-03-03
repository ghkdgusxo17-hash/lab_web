import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { getReadingPapers } from '@/actions/paper'
import { ChunkedDownloadButton } from '@/components/ui/ChunkedDownloadButton'
import { ArrowLeft, BookOpen, Plus, FolderOpen, ExternalLink, FileText, Trash2 } from 'lucide-react'
import { DeleteReadingPaperButton } from './DeleteReadingPaperButton'
import { UserAvatar } from '@/components/ui/UserAvatar'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Paper Reading | CPE Lab' }

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
        .replace(/\. /g, '.').replace(/\.$/, '')
}

export default async function ReadingPaperPage() {
    const session = await auth()
    const papers = await getReadingPapers()
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
                                <div className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-green-600" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                                    Paper Reading
                                </h1>
                            </div>
                        </div>
                        {canWrite && (
                            <Link href="/materials/paper/reading/new" className="btn-primary px-5 py-2.5 text-white text-sm" style={{ background: '#16a34a' }}>
                                <Plus className="w-4 h-4" />
                                논문 등록
                            </Link>
                        )}
                    </div>

                    {/* Grid */}
                    {papers.length === 0 ? (
                        <div className="py-20 text-center">
                            <FolderOpen className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">등록된 논문이 없습니다</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {papers.map(paper => {
                                const isOwner = session?.user?.id === paper.readerId || session?.user?.isAdmin
                                return (
                                    <div key={paper.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                                        {/* 헤더 */}
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <h3 className="font-bold text-slate-900 dark:text-white leading-snug flex-1">
                                                {paper.title}
                                            </h3>
                                            {isOwner && <DeleteReadingPaperButton paperId={paper.id} />}
                                        </div>

                                        {/* 메타 */}
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-sm text-slate-500 dark:text-slate-400">
                                            {paper.authors && <span>{paper.authors}</span>}
                                            {paper.year && <span>{paper.year}</span>}
                                            {paper.externalUrl && (
                                                <a href={paper.externalUrl} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs">
                                                    <ExternalLink className="w-3 h-3" /> 원문
                                                </a>
                                            )}
                                        </div>

                                        {/* 초록 */}
                                        {paper.abstract && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-3 leading-relaxed">
                                                {paper.abstract}
                                            </p>
                                        )}

                                        {/* 하단 */}
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <UserAvatar src={paper.reader.image} name={paper.reader.name} size={20} />
                                                <span className="text-xs text-slate-500">{paper.reader.name} · {formatDate(paper.createdAt)}</span>
                                            </div>
                                            {paper.pptUrl && paper.pptFilename && (
                                                <ChunkedDownloadButton
                                                    url={paper.pptUrl}
                                                    filename={paper.pptFilename}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg hover:bg-green-100 transition-colors"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    발표자료
                                                </ChunkedDownloadButton>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}
