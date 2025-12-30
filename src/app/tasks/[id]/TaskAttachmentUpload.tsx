'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { uploadTaskAttachment } from '@/actions/task'

interface TaskAttachmentUploadProps {
    taskId: string
}

export function TaskAttachmentUpload({ taskId }: TaskAttachmentUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
        }
    }

    function handleRemoveFile() {
        setFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    async function handleUpload() {
        if (!file) return

        setLoading(true)
        const formData = new FormData()
        formData.set('file', file)

        const result = await uploadTaskAttachment(taskId, formData)

        if (result.error) {
            alert(result.error)
        } else {
            setFile(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
        setLoading(false)
    }

    return (
        <div>
            {!file ? (
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    파일 첨부
                </button>
            ) : (
                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                        {file.name}
                    </span>
                    <button
                        onClick={handleRemoveFile}
                        className="p-1 text-slate-400 hover:text-red-500"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={loading}
                        className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? '업로드 중...' : '업로드'}
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
    )
}
