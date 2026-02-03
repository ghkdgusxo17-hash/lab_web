'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Download, Trash2, User, FolderOpen, Mic, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { deleteLabMeetingMaterial } from '@/actions/lab-meeting'

interface Material {
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
    }
    transcription: {
        id: string
        status: string
        summary: string | null
    } | null
    createdAt: Date
}

interface Props {
    materials: Material[]
    currentUserId: string
    isAdmin: boolean
}

const categoryLabels: Record<string, string> = {
    PPT: 'PPT',
    PAPER: '논문',
    DATA: '데이터',
    OTHER: '기타',
}

const categoryColors: Record<string, string> = {
    PPT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
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

export function MaterialList({ materials, currentUserId, isAdmin }: Props) {
    const router = useRouter()
    const [deletingId, setDeletingId] = useState<string | null>(null)

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

    if (materials.length === 0) {
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
            {materials.map((material) => {
                const canDelete = material.uploader.id === currentUserId || isAdmin

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
                                    </span>
                                    <span>{formatFileSize(material.size)}</span>
                                    <span>{formatDate(material.createdAt)}</span>
                                </div>

                                {/* Transcription Status */}
                                {material.transcription ? (
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
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <a
                                    href={material.url}
                                    download={material.filename}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                    title="다운로드"
                                >
                                    <Download className="w-5 h-5" />
                                </a>
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
