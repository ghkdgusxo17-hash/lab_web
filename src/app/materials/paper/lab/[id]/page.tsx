import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { getLabPaper } from '@/actions/paper'
import { ChunkedDownloadButton } from '@/components/ui/ChunkedDownloadButton'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { ArrowLeft, FileText, RotateCcw, ExternalLink, Download } from 'lucide-react'
import { AddRevisionForm } from './AddRevisionForm'
import { DeletePaperButton, DeleteRevisionButton } from './DeleteButtons'
import { StatusSelector } from './StatusSelector'

export const dynamic = 'force-dynamic'

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
        .replace(/\. /g, '.').replace(/\.$/, '')
}

function formatSize(bytes: number) {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const paper = await getLabPaper(id)
    return { title: paper ? `${paper.title} | CPE Lab` : '논문 | CPE Lab' }
}

export default async function LabPaperDetailPage({ params }: Props) {
    const { id } = await params
    const [paper, session] = await Promise.all([getLabPaper(id), auth()])
    if (!paper) notFound()

    const isOwner = session?.user?.id === paper.uploaderId || session?.user?.isAdmin
    const canWrite = session?.user?.isApproved || session?.user?.isAdmin

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* 뒤로가기 */}
                    <Link href="/materials/paper/lab" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Lab Papers
                    </Link>

                    {/* 논문 정보 카드 */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 mb-6">
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                                        {paper.title}
                                    </h1>
                                    {paper.journal && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{paper.journal} {paper.year && `(${paper.year})`}</p>
                                    )}
                                </div>
                            </div>
                            {isOwner && <DeletePaperButton paperId={paper.id} />}
                        </div>

                        {/* 상태 선택 */}
                        <div className="mb-6">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">진행 상태</p>
                            {isOwner
                                ? <StatusSelector paperId={paper.id} currentStatus={paper.status} />
                                : <StatusBadge status={paper.status} />
                            }
                        </div>

                        {/* DOI */}
                        {paper.doi && (
                            <div className="mb-6">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">DOI</p>
                                <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                                    {paper.doi} <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        )}

                        {/* 논문 파일 */}
                        {paper.url && paper.filename && (
                            <div className="mb-6">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">논문 파일</p>
                                <ChunkedDownloadButton
                                    url={paper.url}
                                    filename={paper.filename}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
                                >
                                    <Download className="w-4 h-4" />
                                    {paper.filename}
                                    {paper.size && <span className="text-blue-400 dark:text-blue-500">({formatSize(paper.size)})</span>}
                                </ChunkedDownloadButton>
                            </div>
                        )}

                        {/* 공저자 */}
                        {paper.authors.length > 0 && (
                            <div className="mb-6">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">공저자</p>
                                <div className="flex flex-wrap gap-2">
                                    {paper.authors.map(a => (
                                        <span key={a.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm text-slate-700 dark:text-slate-300">
                                            <UserAvatar src={a.user.image} name={a.user.name} size={16} />
                                            {a.user.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 초록 */}
                        {paper.abstract && (
                            <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">초록</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{paper.abstract}</p>
                            </div>
                        )}
                    </div>

                    {/* Revisions 섹션 */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <RotateCcw className="w-5 h-5 text-orange-600" />
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Revisions
                                    <span className="ml-2 text-sm font-normal text-slate-400">({paper.revisions.length})</span>
                                </h2>
                            </div>
                            {canWrite && <AddRevisionForm paperId={paper.id} />}
                        </div>

                        {paper.revisions.length === 0 ? (
                            <div className="text-center py-10">
                                <RotateCcw className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                                <p className="text-sm text-slate-400">등록된 리비전이 없습니다</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {paper.revisions.map(rev => {
                                    const canDelete = session?.user?.id === rev.uploaderId || session?.user?.isAdmin
                                    return (
                                        <div key={rev.id} className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                            <span className="w-8 h-8 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                v{rev.version}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{rev.filename}</p>
                                                {rev.note && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rev.note}</p>}
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {rev.uploader.name} · {formatDate(rev.createdAt)} · {formatSize(rev.size)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <ChunkedDownloadButton
                                                    url={rev.url}
                                                    filename={rev.filename}
                                                    className="p-1.5 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition-colors"
                                                />
                                                {canDelete && <DeleteRevisionButton revisionId={rev.id} />}
                                            </div>
                                        </div>
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

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    WRITING:      { label: '작성중', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    SUBMITTED:    { label: '투고',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    UNDER_REVIEW: { label: '심사중', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    REVISION:     { label: '리비전', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    ACCEPTED:     { label: '수락',   color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    PUBLISHED:    { label: '게재',   color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
}

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_MAP[status] ?? STATUS_MAP.WRITING
    return <span className={`px-3 py-1 text-xs font-bold rounded-full ${s.color}`}>{s.label}</span>
}
