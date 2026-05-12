'use client'

import { useState } from 'react'
import { FileText, Link as LinkIcon, ExternalLink, Download, Trash2 } from 'lucide-react'
import { deleteWorkspaceResource } from '@/actions/workspace-resource'

interface Resource {
    id: string
    title: string
    description: string | null
    type: string
    filename: string | null
    url: string
    size: number | null
    uploader: {
        id: string
        name: string | null
        image: string | null
    }
    createdAt: Date
}

interface ResourceListProps {
    resources: Resource[]
    currentUserId: string
    isLeader: boolean
}

function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
    })
}

export function ResourceList({ resources, currentUserId, isLeader }: ResourceListProps) {
    const [loading, setLoading] = useState<string | null>(null)

    async function handleDelete(id: string) {
        if (!confirm('이 자료를 삭제하시겠습니까?')) return
        setLoading(id)
        await deleteWorkspaceResource(id)
        setLoading(null)
    }

    if (resources.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500">공유된 자료가 없습니다</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {resources.map((resource) => {
                const canDelete = resource.uploader.id === currentUserId || isLeader
                const isFile = resource.type === 'FILE'

                return (
                    <div
                        key={resource.id}
                        className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isFile
                            ? 'bg-purple-100 dark:bg-purple-900/30'
                            : 'bg-green-100 dark:bg-green-900/30'
                            }`}>
                            {isFile ? (
                                <FileText className="w-5 h-5 text-purple-600" />
                            ) : (
                                <LinkIcon className="w-5 h-5 text-green-600" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 dark:text-white truncate">
                                {resource.title}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span>{resource.uploader.name}</span>
                                <span>{formatDate(resource.createdAt)}</span>
                                {isFile && resource.size && (
                                    <span>{formatFileSize(resource.size)}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {isFile ? (
                                <a
                                    href={`/api/workspaces/resources/${resource.id}/download`}
                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="다운로드"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                            ) : (
                                <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="링크 열기"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                            {canDelete && (
                                <button
                                    onClick={() => handleDelete(resource.id)}
                                    disabled={loading === resource.id}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                    title="삭제"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
