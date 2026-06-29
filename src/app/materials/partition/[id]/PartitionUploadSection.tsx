'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X, ChevronDown, ChevronUp } from 'lucide-react'
import { uploadFileInChunks } from '@/lib/chunked-upload'

interface Props {
    partitionId: string
}

export function PartitionUploadSection({ partitionId }: Props) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [progress, setProgress] = useState(0)

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            if (!title) {
                setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
            }
            setIsExpanded(true)
        }
    }

    function handleRemoveFile() {
        setFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    function resetForm() {
        setTitle('')
        setDescription('')
        setFile(null)
        setIsExpanded(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!file) {
            alert('파일을 선택해주세요.')
            return
        }

        if (!title) {
            alert('제목을 입력해주세요.')
            return
        }

        setLoading(true)
        setProgress(0)

        try {
            await uploadFileInChunks({
                file,
                partitionId,
                title,
                description,
                onProgress: setProgress,
            })
            resetForm()
            setLoading(false)
            setProgress(0)
            router.refresh()
        } catch (error) {
            alert(error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.')
            setLoading(false)
            setProgress(0)
        }
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 overflow-hidden">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                    <Upload className="w-5 h-5 text-blue-500" />
                    자료 업로드
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
            </button>

            {isExpanded && (
                <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-4">
                    {/* File Upload */}
                    <div>
                        {!file ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                            >
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-slate-600 dark:text-slate-400 font-medium">
                                    클릭하여 파일 선택 (최대 100MB)
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                    PDF, PPT, 문서, 이미지 등
                                </p>
                            </div>
                        ) : (
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 dark:text-white truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            제목 *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="자료 제목"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            설명 (선택)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            placeholder="자료에 대한 간단한 설명"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm resize-none"
                        />
                    </div>

                    {/* Progress */}
                    {loading && (
                        <div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-blue-600 transition-all duration-200"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                {progress < 100 ? `업로드 중... ${progress}%` : '마무리 중...'}
                            </p>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={resetForm}
                            disabled={loading}
                            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !file}
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? `업로드 중... ${progress}%` : '업로드'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
