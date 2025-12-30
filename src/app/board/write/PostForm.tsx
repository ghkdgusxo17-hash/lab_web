'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Paperclip, X, FileText } from 'lucide-react'
import Link from 'next/link'
import { createPost } from '@/actions/board'
import { RichTextEditor } from '@/components/editor'

interface PostFormProps {
    isAdmin: boolean
    initialData?: {
        id: string
        title: string
        content: string
        type: string
    }
}

interface UploadedFile {
    filename: string
    url: string
    size: number
    mimeType: string
}

export function PostForm({ isAdmin, initialData }: PostFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [files, setFiles] = useState<UploadedFile[]>([])
    const [uploading, setUploading] = useState(false)
    const [content, setContent] = useState(initialData?.content || '')
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const selectedFiles = e.target.files
        if (!selectedFiles || selectedFiles.length === 0) return

        setUploading(true)
        setError('')

        for (const file of Array.from(selectedFiles)) {
            const formData = new FormData()
            formData.append('file', file)

            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.error || '업로드 실패')
                }

                const data = await response.json()
                setFiles(prev => [...prev, {
                    filename: file.name,
                    url: data.url,
                    size: file.size,
                    mimeType: file.type,
                }])
            } catch (err: any) {
                setError(err.message || '파일 업로드 실패')
            }
        }

        setUploading(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    function removeFile(index: number) {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    function formatFileSize(bytes: number) {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        formData.set('content', content)
        formData.set('attachments', JSON.stringify(files))

        try {
            const result = await createPost(formData)
            if (result?.error) {
                setError(result.error)
                setLoading(false)
            }
        } catch (err: any) {
            if (err?.digest?.includes('NEXT_REDIRECT')) {
                throw err
            }
            setError('오류가 발생했습니다.')
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-lg">
                {/* Type selector */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        게시판 선택
                    </label>
                    <div className="flex flex-wrap gap-4">
                        {isAdmin && (
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    value="NOTICE"
                                    defaultChecked={initialData?.type === 'NOTICE'}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">공지사항</span>
                            </label>
                        )}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="SEMINAR"
                                defaultChecked={initialData?.type === 'SEMINAR'}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">세미나</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="FREE"
                                defaultChecked={!isAdmin && !initialData?.type || initialData?.type === 'FREE'}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">자유게시판</span>
                        </label>
                    </div>
                </div>

                {/* Title */}
                <div className="mb-6">
                    <label htmlFor="title" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        제목
                    </label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        required
                        defaultValue={initialData?.title}
                        placeholder="제목을 입력하세요"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Content - Rich Text Editor */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        내용
                    </label>
                    <RichTextEditor
                        content={content}
                        onChange={setContent}
                        placeholder="내용을 입력하세요... (Ctrl+V로 이미지 붙여넣기 가능)"
                        minHeight="300px"
                    />
                </div>

                {/* File attachments */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        첨부파일
                    </label>

                    {files.length > 0 && (
                        <div className="mb-3 space-y-2">
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                            {file.filename}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.hwp,.txt,.zip,.rar,.7z,.jpg,.jpeg,.png,.gif"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
                    >
                        {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Paperclip className="w-4 h-4" />
                        )}
                        파일 첨부
                    </button>
                    <p className="mt-2 text-xs text-slate-500">
                        PDF, PPT, Word, Excel, HWP, 이미지, 압축파일 (최대 10MB)
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <Link
                    href="/board"
                    className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    목록으로
                </Link>
                <button
                    type="submit"
                    disabled={loading || uploading}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            저장 중...
                        </span>
                    ) : (
                        '저장하기'
                    )}
                </button>
            </div>
        </form>
    )
}
