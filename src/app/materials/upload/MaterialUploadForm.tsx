'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X } from 'lucide-react'
import { uploadMaterial } from '@/actions/material'

const categories = [
    { value: 'PAPER', label: '논문' },
    { value: 'PPT', label: 'PPT' },
    { value: 'DATA', label: '데이터' },
    { value: 'OTHER', label: '기타' },
]

export function MaterialUploadForm() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('OTHER')
    const [file, setFile] = useState<File | null>(null)

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            if (!title) {
                // Auto-fill title from filename
                setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
            }
        }
    }

    function handleRemoveFile() {
        setFile(null)
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

        setLoading(true)

        const formData = new FormData()
        formData.set('title', title)
        formData.set('description', description)
        formData.set('category', category)
        formData.set('file', file)

        const result = await uploadMaterial(formData)

        if (result.error) {
            alert(result.error)
            setLoading(false)
        } else {
            router.push('/materials')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    제목 *
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="자료 제목"
                />
            </div>

            {/* Category */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    카테고리
                </label>
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.value}
                            type="button"
                            onClick={() => setCategory(cat.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${category === cat.value
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    설명 (선택)
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="자료에 대한 간단한 설명"
                />
            </div>

            {/* File Upload */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    파일 *
                </label>

                {!file ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                    >
                        <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                            클릭하여 파일 선택
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            PDF, PPT, XLSX, DOC 등
                        </p>
                    </div>
                ) : (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
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

            {/* Submit */}
            <button
                type="submit"
                disabled={loading || !file}
                className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {loading ? '업로드 중...' : '업로드'}
            </button>
        </form>
    )
}
