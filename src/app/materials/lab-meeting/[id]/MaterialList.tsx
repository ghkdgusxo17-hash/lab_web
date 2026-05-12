'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { FileText, Download, Trash2, User, UserCheck, FolderOpen, Mic, CheckCircle, Loader2, AlertCircle, MessageSquare, Send, X, Edit2, Eye } from 'lucide-react'
import { MedalBadge } from '@/components/ui/MedalBadge'
import { ChunkedDownloadButton } from '@/components/ui/ChunkedDownloadButton'
import { deleteLabMeetingMaterial, addMaterialFeedback, deleteMaterialFeedback, updateMaterialFeedback } from '@/actions/lab-meeting'
import { updateMaterialPresenter } from '@/actions/meeting-transcription'
import { getLabMeetingMaterialAccessPath } from '@/lib/lab-meeting-material-security-shared'
import { isOnlyOfficeViewable } from '@/lib/onlyoffice-shared'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })
const MDPreview = dynamic(() => import('@uiw/react-md-editor').then(mod => mod.default.Markdown), { ssr: false })

interface ReferenceMaterial {
    id: string
    title: string
    description: string | null
    category: string
    filename: string
    url: string
    size: number
    mimeType: string
    uploader: {
        id: string
        name: string | null
        image: string | null
        medalPoints?: number
    }
    createdAt: Date
}

interface Material {
    id: string
    title: string
    description: string | null
    category: string
    filename: string
    url: string
    size: number
    mimeType: string
    parentMaterialId?: string | null
    uploader: {
        id: string
        name: string | null
        image: string | null
        medalPoints?: number
    }
    presenter: {
        id: string
        name: string | null
        image: string | null
    } | null
    transcription: {
        id: string
        status: string
        summary: string | null
    } | null
    feedbacks: {
        id: string
        content: string
        author: {
            id: string
            name: string | null
            image: string | null
        }
        createdAt: Date
    }[]
    referenceMaterials?: ReferenceMaterial[]
    createdAt: Date
}

interface Props {
    materials: Material[]
    labMeetingId: string
    currentUserId: string
    isAdmin: boolean
    presenters?: {
        id: string
        name: string | null
        image: string | null
    }[]
}

const categoryLabels: Record<string, string> = {
    PPT: 'PPT',
    REFERENCE: '참고자료',
    PAPER: '논문',
    DATA: '데이터',
    OTHER: '기타',
}

const categoryColors: Record<string, string> = {
    PPT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    REFERENCE: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    PAPER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    DATA: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    OTHER: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export function MaterialList({ materials, labMeetingId, currentUserId, isAdmin, presenters = [] }: Props) {
    const router = useRouter()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [presenterLoadingId, setPresenterLoadingId] = useState<string | null>(null)
    const [newFeedback, setNewFeedback] = useState<Record<string, string>>({})
    const [feedbackLoading, setFeedbackLoading] = useState<string | null>(null)
    const [expandedFeedback, setExpandedFeedback] = useState<Set<string>>(new Set())
    const [writingNew, setWritingNew] = useState<Set<string>>(new Set())
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState('')
    const visibleMaterials = materials.filter((material) => !material.parentMaterialId)

    async function handleAddFeedback(materialId: string) {
        const text = newFeedback[materialId]?.trim()
        if (!text) return
        setFeedbackLoading(materialId)
        const result = await addMaterialFeedback(materialId, text)
        if (result.error) alert(result.error)
        else {
            setNewFeedback(prev => ({ ...prev, [materialId]: '' }))
            setWritingNew(prev => { const next = new Set(prev); next.delete(materialId); return next })
            router.refresh()
        }
        setFeedbackLoading(null)
    }

    async function handleUpdateFeedback(feedbackId: string) {
        if (!editContent.trim()) return
        setFeedbackLoading(feedbackId)
        const result = await updateMaterialFeedback(feedbackId, editContent)
        if (result.error) alert(result.error)
        else { setEditingId(null); router.refresh() }
        setFeedbackLoading(null)
    }

    async function handleDeleteFeedback(feedbackId: string) {
        if (!confirm('이 피드백을 삭제하시겠습니까?')) return
        const result = await deleteMaterialFeedback(feedbackId)
        if (result.error) alert(result.error)
        else router.refresh()
    }

    async function handleSetPresenter(materialId: string, presenterId: string | null) {
        setPresenterLoadingId(materialId)
        const result = await updateMaterialPresenter(materialId, presenterId)
        if (result.error) {
            alert(result.error)
        } else {
            router.refresh()
        }
        setPresenterLoadingId(null)
    }

    async function handleDelete(materialId: string) {
        if (!confirm('이 자료를 삭제하시겠습니까?')) return

        setDeletingId(materialId)
        const result = await deleteLabMeetingMaterial(materialId)

        if (result.error) {
            alert(result.error)
        } else {
            router.refresh()
        }
        setDeletingId(null)
    }

    if (visibleMaterials.length === 0) {
        return (
            <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">
                    아직 업로드된 자료가 없습니다
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {visibleMaterials.map((material) => {
                const canDelete = material.uploader.id === currentUserId || isAdmin
                const isReference = material.category === 'REFERENCE'
                const canAssignPresenter = !isReference && (material.uploader.id === currentUserId || isAdmin)
                const canOpenViewer = isOnlyOfficeViewable(material.filename, material.mimeType)
                const accessPath = getLabMeetingMaterialAccessPath(material.id)
                const referenceMaterials = material.referenceMaterials ?? []
                const presenterOptions = material.presenter && !presenters.some(p => p.id === material.presenter?.id)
                    ? [material.presenter, ...presenters]
                    : presenters

                return (
                    <div
                        key={material.id}
                        className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <FileText className="w-6 h-6 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${categoryColors[material.category] || categoryColors.OTHER}`}>
                                        {categoryLabels[material.category] || material.category}
                                    </span>
                                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                        {material.title}
                                    </h3>
                                </div>
                                {material.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                                        {material.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1">
                                        {material.uploader.image ? (
                                            <img
                                                src={material.uploader.image}
                                                alt={material.uploader.name || ''}
                                                className="w-4 h-4 rounded-full"
                                            />
                                        ) : (
                                            <User className="w-4 h-4" />
                                        )}
                                        {material.uploader.name}
                                        {' '}<MedalBadge medalPoints={material.uploader.medalPoints || 0} size="sm" />
                                    </span>
                                    <span>{formatFileSize(material.size)}</span>
                                    <span>{formatDate(material.createdAt)}</span>
                                </div>

                                {/* Presenter info */}
                                {!isReference && (
                                <div className="flex items-center gap-2 mt-1.5 text-xs">
                                    {canAssignPresenter && presenterOptions.length > 0 ? (
                                        <label className="inline-flex items-center gap-1.5">
                                            <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-slate-500 dark:text-slate-400">발표자</span>
                                            <select
                                                value={material.presenter?.id || ''}
                                                onChange={(e) => handleSetPresenter(material.id, e.target.value || null)}
                                                disabled={presenterLoadingId === material.id}
                                                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                            >
                                                <option value="">미지정</option>
                                                {presenterOptions.map((presenter) => (
                                                    <option key={presenter.id} value={presenter.id}>
                                                        {presenter.name || '이름 없음'}
                                                    </option>
                                                ))}
                                            </select>
                                            {presenterLoadingId === material.id && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                                        </label>
                                    ) : material.presenter ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium">
                                            <UserCheck className="w-3 h-3" />
                                            발표자: {material.presenter.name}
                                            {(material.presenter.id === currentUserId || isAdmin) && (
                                                <button
                                                    onClick={() => handleSetPresenter(material.id, null)}
                                                    disabled={presenterLoadingId === material.id}
                                                    className="ml-1 text-emerald-500 hover:text-red-500 transition-colors"
                                                    title="발표자 해제"
                                                >
                                                    {presenterLoadingId === material.id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <span>×</span>
                                                    )}
                                                </button>
                                            )}
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleSetPresenter(material.id, currentUserId)}
                                            disabled={presenterLoadingId === material.id}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors disabled:opacity-50"
                                        >
                                            {presenterLoadingId === material.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <UserCheck className="w-3 h-3" />
                                            )}
                                            나를 발표자로 등록
                                        </button>
                                    )}
                                </div>
                                )}

                                {/* Transcription Status */}
                                {!isReference && (material.transcription ? (
                                    material.transcription.status === 'FAILED' ? (
                                        <Link
                                            href={`/meetings/upload?materialId=${material.id}`}
                                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full mt-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                        >
                                            <AlertCircle className="w-3 h-3" />
                                            처리 실패 - 다시 시도
                                        </Link>
                                    ) : (
                                    <Link
                                        href={`/meetings/${material.transcription.id}`}
                                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full mt-2 ${
                                            material.transcription.status === 'COMPLETED'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}
                                    >
                                        {material.transcription.status === 'COMPLETED' ? (
                                            <>
                                                <CheckCircle className="w-3 h-3" />
                                                발표요약 보기
                                            </>
                                        ) : (
                                            <>
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                처리 중...
                                            </>
                                        )}
                                    </Link>
                                    )
                                ) : (
                                    <Link
                                        href={`/meetings/upload?materialId=${material.id}`}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full mt-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                    >
                                        <Mic className="w-3 h-3" />
                                        녹음 업로드
                                    </Link>
                                ))}

                                {referenceMaterials.length > 0 && (
                                    <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/50 p-3 dark:border-cyan-900/40 dark:bg-cyan-950/10">
                                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                                            <FileText className="h-3.5 w-3.5" />
                                            참고자료 {referenceMaterials.length}개
                                        </div>
                                        <div className="space-y-2">
                                            {referenceMaterials.map((reference) => {
                                                const referenceAccessPath = getLabMeetingMaterialAccessPath(reference.id)
                                                const canOpenReferenceViewer = isOnlyOfficeViewable(reference.filename, reference.mimeType)

                                                return (
                                                    <div
                                                        key={reference.id}
                                                        className="flex flex-col gap-2 rounded-lg border border-cyan-100 bg-white px-3 py-2 dark:border-cyan-900/30 dark:bg-slate-900 sm:flex-row sm:items-center"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                                                                {reference.title}
                                                            </p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                {reference.filename} · {formatFileSize(reference.size)}
                                                            </p>
                                                        </div>
                                                        <div className="flex shrink-0 items-center gap-1">
                                                            {canOpenReferenceViewer && (
                                                                <Link
                                                                    href={`/materials/lab-meeting/${labMeetingId}/materials/${reference.id}/viewer`}
                                                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-cyan-700 hover:bg-cyan-100 dark:text-cyan-300 dark:hover:bg-cyan-950/40"
                                                                    title="새 창에서 보기"
                                                                >
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                    보기
                                                                </Link>
                                                            )}
                                                            <ChunkedDownloadButton
                                                                url={referenceAccessPath}
                                                                filename={reference.filename}
                                                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-950/40"
                                                            >
                                                                <Download className="h-3.5 w-3.5" />
                                                                다운로드
                                                            </ChunkedDownloadButton>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Feedback Section */}
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                    <button
                                        onClick={() => setExpandedFeedback(prev => {
                                            const next = new Set(prev)
                                            next.has(material.id) ? next.delete(material.id) : next.add(material.id)
                                            return next
                                        })}
                                        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        교수님 피드백 ({material.feedbacks.length})
                                    </button>

                                    {expandedFeedback.has(material.id) && (
                                        <div className="mt-2 space-y-2">
                                            {material.feedbacks.map((fb) => (
                                                <div key={fb.id} className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/30">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {fb.author.image ? (
                                                            <img src={fb.author.image} alt="" className="w-5 h-5 rounded-full" />
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                                                {fb.author.name?.slice(0, 1) || '?'}
                                                            </div>
                                                        )}
                                                        <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">{fb.author.name}</span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(fb.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {(fb.author.id === currentUserId || isAdmin) && (
                                                            <div className="flex items-center gap-1 ml-auto">
                                                                <button
                                                                    onClick={() => { setEditingId(fb.id); setEditContent(fb.content) }}
                                                                    className="text-slate-400 hover:text-blue-500 transition-colors"
                                                                    title="수정"
                                                                >
                                                                    <Edit2 className="w-3 h-3" />
                                                                </button>
                                                                <button onClick={() => handleDeleteFeedback(fb.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="삭제">
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {editingId === fb.id ? (
                                                        <div data-color-mode="light">
                                                            <MDEditor
                                                                value={editContent}
                                                                onChange={(v) => setEditContent(v || '')}
                                                                height={200}
                                                                preview="live"
                                                            />
                                                            <div className="flex gap-2 mt-2">
                                                                <button
                                                                    onClick={() => handleUpdateFeedback(fb.id)}
                                                                    disabled={feedbackLoading === fb.id}
                                                                    className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                                                                >
                                                                    {feedbackLoading === fb.id ? '저장 중...' : '저장'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingId(null)}
                                                                    className="px-3 py-1 text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg"
                                                                >
                                                                    취소
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div data-color-mode="light" className="prose prose-sm max-w-none dark:prose-invert text-sm">
                                                            <MDPreview source={fb.content} />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* New feedback */}
                                            {writingNew.has(material.id) ? (
                                                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <div data-color-mode="light">
                                                        <MDEditor
                                                            value={newFeedback[material.id] || ''}
                                                            onChange={(v) => setNewFeedback(prev => ({ ...prev, [material.id]: v || '' }))}
                                                            height={200}
                                                            preview="live"
                                                            textareaProps={{ placeholder: '교수님 피드백을 Markdown으로 작성하세요...' }}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => handleAddFeedback(material.id)}
                                                            disabled={feedbackLoading === material.id || !newFeedback[material.id]?.trim()}
                                                            className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-1"
                                                        >
                                                            {feedbackLoading === material.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                                            저장
                                                        </button>
                                                        <button
                                                            onClick={() => setWritingNew(prev => { const next = new Set(prev); next.delete(material.id); return next })}
                                                            className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg"
                                                        >
                                                            취소
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setWritingNew(prev => new Set(prev).add(material.id))}
                                                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                                                >
                                                    <Send className="w-3 h-3" />
                                                    피드백 작성
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {canOpenViewer && (
                                    <Link
                                        href={`/materials/lab-meeting/${labMeetingId}/materials/${material.id}/viewer`}
                                        className="p-2 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg transition-colors"
                                        title="뷰어로 열기"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </Link>
                                )}
                                <ChunkedDownloadButton
                                    url={accessPath}
                                    filename={material.filename}
                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                >
                                    <Download className="w-5 h-5" />
                                </ChunkedDownloadButton>
                                {canDelete && (
                                    <button
                                        onClick={() => handleDelete(material.id)}
                                        disabled={deletingId === material.id}
                                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                                        title="삭제"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
