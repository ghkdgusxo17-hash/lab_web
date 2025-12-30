'use client'

import { useState } from 'react'
import { Upload, Link as LinkIcon, X } from 'lucide-react'
import { addFileResource, addLinkResource } from '@/actions/workspace-resource'

interface Section {
    id: string
    name: string
}

interface ResourceUploadProps {
    workspaceId: string
    sections: Section[]
}

type UploadType = 'FILE' | 'LINK' | null

export function ResourceUpload({ workspaceId, sections }: ResourceUploadProps) {
    const [uploadType, setUploadType] = useState<UploadType>(null)
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [url, setUrl] = useState('')
    const [sectionId, setSectionId] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData()
        formData.set('title', title)
        formData.set('description', description)
        if (sectionId) {
            formData.set('sectionId', sectionId)
        }

        let result
        if (uploadType === 'FILE' && file) {
            formData.set('file', file)
            result = await addFileResource(workspaceId, formData)
        } else if (uploadType === 'LINK') {
            formData.set('url', url)
            result = await addLinkResource(workspaceId, formData)
        }

        if (result?.error) {
            alert(result.error)
        } else {
            // Reset form
            setUploadType(null)
            setTitle('')
            setDescription('')
            setFile(null)
            setUrl('')
            setSectionId('')
        }
        setLoading(false)
    }

    function handleClose() {
        setUploadType(null)
        setTitle('')
        setDescription('')
        setFile(null)
        setUrl('')
        setSectionId('')
    }

    if (!uploadType) {
        return (
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setUploadType('FILE')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                    <Upload className="w-5 h-5" />
                    파일 업로드
                </button>
                <button
                    onClick={() => setUploadType('LINK')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                    <LinkIcon className="w-5 h-5" />
                    링크 추가
                </button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white">
                    {uploadType === 'FILE' ? '파일 업로드' : '링크 추가'}
                </h3>
                <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-3">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="제목 *"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />

                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="설명 (선택)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />

                {sections.length > 0 && (
                    <select
                        value={sectionId}
                        onChange={(e) => setSectionId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    >
                        <option value="">섹션 선택 (선택사항)</option>
                        {sections.map((section) => (
                            <option key={section.id} value={section.id}>{section.name}</option>
                        ))}
                    </select>
                )}

                {uploadType === 'FILE' ? (
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    />
                ) : (
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    />
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                    {loading ? '업로드 중...' : '추가하기'}
                </button>
            </div>
        </form>
    )
}
