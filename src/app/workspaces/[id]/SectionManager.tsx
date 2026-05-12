'use client'

import { useState } from 'react'
import { FolderPlus, Folder, ChevronDown, ChevronUp, Trash2, FileText, Link as LinkIcon, Download, X, Edit2, Check } from 'lucide-react'
import { createWorkspaceSection, updateWorkspaceSection, deleteWorkspaceSection } from '@/actions/workspace-section'
import { deleteWorkspaceResource } from '@/actions/workspace-resource'

interface Resource {
    id: string
    title: string
    description: string | null
    type: string
    filename: string | null
    url: string
    size: number | null
    uploader: { id: string; name: string | null; image: string | null }
    createdAt: Date
}

interface Section {
    id: string
    name: string
    resources: Resource[]
}

interface SectionManagerProps {
    workspaceId: string
    sections: Section[]
    unsectionedResources: Resource[]
    isLeader: boolean
    isMember: boolean
    currentUserId: string
}

export function SectionManager({
    workspaceId,
    sections,
    unsectionedResources,
    isLeader,
    isMember,
    currentUserId
}: SectionManagerProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(sections.map(s => s.id)))
    const [showAddForm, setShowAddForm] = useState(false)
    const [newSectionName, setNewSectionName] = useState('')
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const [loading, setLoading] = useState(false)

    function toggleSection(sectionId: string) {
        const newExpanded = new Set(expandedSections)
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId)
        } else {
            newExpanded.add(sectionId)
        }
        setExpandedSections(newExpanded)
    }

    async function handleCreateSection() {
        if (!newSectionName.trim()) return
        setLoading(true)
        const result = await createWorkspaceSection(workspaceId, newSectionName)
        if (result.error) {
            alert(result.error)
        } else {
            setNewSectionName('')
            setShowAddForm(false)
        }
        setLoading(false)
    }

    async function handleUpdateSection(sectionId: string) {
        if (!editingName.trim()) return
        setLoading(true)
        const result = await updateWorkspaceSection(sectionId, editingName)
        if (result.error) {
            alert(result.error)
        } else {
            setEditingSectionId(null)
        }
        setLoading(false)
    }

    async function handleDeleteSection(sectionId: string) {
        if (!confirm('이 섹션을 삭제하시겠습니까? 자료는 삭제되지 않고 분류 해제됩니다.')) return
        const result = await deleteWorkspaceSection(sectionId)
        if (result.error) {
            alert(result.error)
        }
    }

    async function handleDeleteResource(resourceId: string) {
        if (!confirm('이 자료를 삭제하시겠습니까?')) return
        const result = await deleteWorkspaceResource(resourceId)
        if (result.error) {
            alert(result.error)
        }
    }

    function formatFileSize(bytes: number | null) {
        if (!bytes) return ''
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    function ResourceItem({ resource, canDelete }: { resource: Resource; canDelete: boolean }) {
        const isFile = resource.type === 'FILE'

        return (
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {isFile ? (
                        <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    ) : (
                        <LinkIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                            {resource.title}
                        </p>
                        <p className="text-xs text-slate-400">
                            {resource.uploader.name}
                            {resource.size && ` • ${formatFileSize(resource.size)}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isFile ? (
                        <a
                            href={`/api/workspaces/resources/${resource.id}/download`}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="다운로드"
                        >
                            <Download className="w-4 h-4" />
                        </a>
                    ) : (
                        <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="링크 열기"
                        >
                            <LinkIcon className="w-4 h-4" />
                        </a>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => handleDeleteResource(resource.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="삭제"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Add Section Button */}
            {isLeader && (
                <div className="mb-4">
                    {showAddForm ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSectionName}
                                onChange={(e) => setNewSectionName(e.target.value)}
                                placeholder="섹션 이름"
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
                            />
                            <button
                                onClick={handleCreateSection}
                                disabled={loading || !newSectionName.trim()}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                추가
                            </button>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="px-3 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                            <FolderPlus className="w-4 h-4" />
                            새 섹션 추가
                        </button>
                    )}
                </div>
            )}

            {/* Sections */}
            {sections.map((section) => {
                const isExpanded = expandedSections.has(section.id)
                const isEditing = editingSectionId === section.id

                return (
                    <div key={section.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="flex items-center gap-3 flex-1 text-left"
                            >
                                <Folder className="w-5 h-5 text-amber-500" />
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="flex-1 px-2 py-1 rounded border border-blue-300 bg-white dark:bg-slate-700 text-sm"
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUpdateSection(section.id)
                                            if (e.key === 'Escape') setEditingSectionId(null)
                                        }}
                                        autoFocus
                                    />
                                ) : (
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {section.name}
                                    </span>
                                )}
                                <span className="text-sm text-slate-400">
                                    ({section.resources.length})
                                </span>
                            </button>
                            <div className="flex items-center gap-1">
                                {isLeader && (
                                    <>
                                        {isEditing ? (
                                            <button
                                                onClick={() => handleUpdateSection(section.id)}
                                                className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setEditingSectionId(section.id)
                                                    setEditingName(section.name)
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteSection(section.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                <button onClick={() => toggleSection(section.id)} className="p-1.5">
                                    {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="p-3 space-y-2 bg-white dark:bg-slate-900">
                                {section.resources.length === 0 ? (
                                    <p className="text-center py-4 text-sm text-slate-400">
                                        이 섹션에 자료가 없습니다
                                    </p>
                                ) : (
                                    section.resources.map((resource) => (
                                        <ResourceItem
                                            key={resource.id}
                                            resource={resource}
                                            canDelete={isLeader || resource.uploader.id === currentUserId}
                                        />
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )
            })}

            {/* Unsectioned Resources */}
            {unsectionedResources.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
                        <span className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            <Folder className="w-5 h-5 text-slate-400" />
                            미분류
                            <span className="text-sm text-slate-400">({unsectionedResources.length})</span>
                        </span>
                    </div>
                    <div className="p-3 space-y-2 bg-white dark:bg-slate-900">
                        {unsectionedResources.map((resource) => (
                            <ResourceItem
                                key={resource.id}
                                resource={resource}
                                canDelete={isLeader || resource.uploader.id === currentUserId}
                            />
                        ))}
                    </div>
                </div>
            )}

            {sections.length === 0 && unsectionedResources.length === 0 && (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">아직 공유된 자료가 없습니다</p>
                </div>
            )}
        </div>
    )
}
