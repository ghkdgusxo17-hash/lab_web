'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, FileText, Plus, Upload, X } from 'lucide-react'
import { uploadLabMeetingMaterialChunked } from '@/lib/chunked-upload'

const categories = [
    { value: 'PPT', label: 'PPT/발표자료' },
    { value: 'PAPER', label: '논문' },
    { value: 'DATA', label: '데이터' },
    { value: 'OTHER', label: '기타' },
]

interface Props {
    labMeetingId: string
    presenters?: {
        id: string
        name: string | null
        image: string | null
    }[]
}

export function MaterialUploadSection({ labMeetingId, presenters = [] }: Props) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const referenceInputRef = useRef<HTMLInputElement>(null)
    const defaultPresenterId = presenters.length === 1 ? presenters[0].id : ''
    const [isExpanded, setIsExpanded] = useState(false)
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('PPT')
    const [presenterId, setPresenterId] = useState(defaultPresenterId)
    const [file, setFile] = useState<File | null>(null)
    const [referenceFiles, setReferenceFiles] = useState<File[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [progress, setProgress] = useState(0)

    function applyMainFile(selectedFile: File) {
        setFile(selectedFile)
        if (!title) {
            setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
        }
        setIsExpanded(true)
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setIsDragging(false)
        const droppedFile = e.dataTransfer.files?.[0]
        if (droppedFile) {
            applyMainFile(droppedFile)
        }
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            applyMainFile(selectedFile)
        }
    }

    function handleReferenceSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const selectedFiles = Array.from(e.target.files ?? [])
        if (selectedFiles.length > 0) {
            setReferenceFiles((current) => [...current, ...selectedFiles])
        }
        if (referenceInputRef.current) {
            referenceInputRef.current.value = ''
        }
    }

    function handleRemoveFile() {
        setFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    function handleRemoveReference(index: number) {
        setReferenceFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))
    }

    function resetForm() {
        setTitle('')
        setDescription('')
        setCategory('PPT')
        setPresenterId(defaultPresenterId)
        setFile(null)
        setReferenceFiles([])
        setIsExpanded(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        if (referenceInputRef.current) {
            referenceInputRef.current.value = ''
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!file) {
            alert('발표자료 파일을 선택해주세요.')
            return
        }

        if (!title) {
            alert('제목을 입력해주세요.')
            return
        }

        setLoading(true)
        setProgress(0)

        try {
            await uploadLabMeetingMaterialChunked({
                labMeetingId,
                file,
                referenceFiles,
                title,
                description,
                category,
                presenterId,
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
        <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
                <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                    <Upload className="h-5 w-5 text-blue-500" />
                    발표자료 업로드
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
            </button>

            {isExpanded && (
                <form onSubmit={handleSubmit} className="space-y-4 p-4 pt-0">
                    <div>
                        {!file ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                                    isDragging
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-slate-300 hover:border-blue-500 dark:border-slate-700 dark:hover:border-blue-500'
                                }`}
                            >
                                <Upload className={`mx-auto mb-2 h-8 w-8 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
                                <p className="font-medium text-slate-600 dark:text-slate-400">
                                    {isDragging ? '여기에 놓으세요' : '클릭 또는 드래그해서 발표자료 선택 (최대 100MB)'}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    PPT, PDF, 문서, 이미지 등
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-slate-900 dark:text-white">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="p-1.5 text-slate-400 transition-colors hover:text-red-500"
                                >
                                    <X className="h-5 w-5" />
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

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            제목 *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="발표자료 제목"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    {presenters.length > 0 && (
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                발표자
                            </label>
                            <select
                                value={presenterId}
                                onChange={(e) => setPresenterId(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                                <option value="">나중에 지정</option>
                                {presenters.map((presenter) => (
                                    <option key={presenter.id} value={presenter.id}>
                                        {presenter.name || '이름 없음'}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                지정하면 발표자별 자료 모아보기에 바로 반영됩니다.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            자료 구분
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setCategory(cat.value)}
                                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                                        category === cat.value
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            설명 (선택)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            placeholder="발표자료에 대한 간단한 설명"
                            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/10">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    참고자료 같이 올리기
                                </p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    발표자료 아래에 논문, 데이터, 보충 이미지 등을 함께 묶어서 보여줍니다.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => referenceInputRef.current?.click()}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-700 transition-colors hover:bg-cyan-50 dark:border-cyan-900/50 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-cyan-950/30"
                            >
                                <Plus className="h-4 w-4" />
                                참고자료 추가
                            </button>
                        </div>

                        {referenceFiles.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {referenceFiles.map((referenceFile, index) => (
                                    <div
                                        key={`${referenceFile.name}-${referenceFile.size}-${index}`}
                                        className="flex items-center gap-3 rounded-lg border border-cyan-100 bg-white px-3 py-2 dark:border-cyan-900/30 dark:bg-slate-900"
                                    >
                                        <FileText className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-300" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                                                {referenceFile.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {(referenceFile.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveReference(index)}
                                            className="p-1 text-slate-400 transition-colors hover:text-red-500"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <input
                            ref={referenceInputRef}
                            type="file"
                            multiple
                            onChange={handleReferenceSelect}
                            className="hidden"
                        />
                    </div>

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

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={resetForm}
                            disabled={loading}
                            className="px-4 py-2 font-medium text-slate-600 transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:text-white"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !file}
                            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? `업로드 중... ${progress}%` : '업로드'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
