'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Download, Trash2, User, FolderOpen } from 'lucide-react'
import { ChunkedDownloadButton } from '@/components/ui/ChunkedDownloadButton'
import { deletePartitionMaterial } from '@/actions/material-partition'

interface Material {
    id: string
    title: string
    description: string | null
    filename: string
    url: string
    size: number
    mimeType: string
    uploader: {
        id: string
        name: string | null
        image: string | null
    }
    createdAt: Date
}

interface Props {
    materials: Material[]
    currentUserId: string
    isAdmin: boolean
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

export function PartitionMaterialList({ materials, currentUserId, isAdmin }: Props) {
    const router = useRouter()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    async function handleDelete(materialId: string) {
        if (!confirm('이 자료를 삭제하시겠습니까?')) return

        setDeletingId(materialId)
        const result = await deletePartitionMaterial(materialId)

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
                                <h3 className="font-semibold text-slate-900 dark:text-white truncate mb-1">
                                    {material.title}
                                </h3>
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
                            </div>
                            <div className="flex items-center gap-1">
                                <ChunkedDownloadButton
                                    url={material.url}
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
