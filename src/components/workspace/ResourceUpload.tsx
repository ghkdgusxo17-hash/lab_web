'use client'

import { useState } from 'react'
import { Upload, Link as LinkIcon, X, FileText } from 'lucide-react'
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
    const [selectedYear, setSelectedYear] = useState('')
    const [selectedMonth, setSelectedMonth] = useState('')
    const [dragActive, setDragActive] = useState(false)

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
            setSelectedYear('')
            setSelectedMonth('')
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
        setSelectedYear('')
        setSelectedMonth('')
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
                    <div className="space-y-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-semibold text-slate-500 mb-1">업로드 위치 선택</p>

                        {/* 1. Year Selection */}
                        <div className="flex gap-2">
                            {(() => {
                                // 1. Group Data Logic
                                const hierarchy = sections.reduce((acc, section) => {
                                    const match = section.name.match(/^(\d{4})[\/.]\s?(\d{2})/)
                                    if (match) {
                                        const [_, year, month] = match
                                        if (!acc[year]) acc[year] = {}
                                        if (!acc[year][month]) acc[year][month] = []
                                        acc[year][month].push(section)
                                    } else {
                                        if (!acc['General']) acc['General'] = {}
                                        if (!acc['General']['Others']) acc['General']['Others'] = []
                                        acc['General']['Others'].push(section)
                                    }
                                    return acc
                                }, {} as Record<string, Record<string, Section[]>>)

                                const years = Object.keys(hierarchy).sort((a, b) => b.localeCompare(a)) // Descending

                                return (
                                    <>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => {
                                                setSelectedYear(e.target.value)
                                                setSelectedMonth('') // Reset month
                                                setSectionId('') // Reset section
                                            }}
                                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                                        >
                                            <option value="">연도 선택</option>
                                            {years.map(year => (
                                                <option key={year} value={year}>{year === 'General' ? '기타' : `${year}년`}</option>
                                            ))}
                                        </select>

                                        {/* 2. Month Selection */}
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => {
                                                setSelectedMonth(e.target.value)
                                                setSectionId('') // Reset section
                                            }}
                                            disabled={!selectedYear}
                                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm disabled:opacity-50"
                                        >
                                            <option value="">월 선택</option>
                                            {selectedYear && hierarchy[selectedYear] && Object.keys(hierarchy[selectedYear]).sort((a, b) => b.localeCompare(a)).map(month => (
                                                <option key={month} value={month}>{month === 'Others' ? '기타' : `${month}월`}</option>
                                            ))}
                                        </select>
                                    </>
                                )
                            })()}
                        </div>

                        {/* 3. Section Selection */}
                        <select
                            value={sectionId}
                            onChange={(e) => setSectionId(e.target.value)}
                            disabled={!selectedYear || !selectedMonth}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-medium disabled:opacity-50"
                        >
                            <option value="">
                                {!selectedYear ? '연도를 먼저 선택하세요' :
                                    !selectedMonth ? '월을 선택하세요' :
                                        '섹션 선택 (필수)'}
                            </option>
                            {(() => {
                                // Re-calculate logic inside render is technically inefficient but fine for small datasets. 
                                // Ideally this grouped structure should be memoized but I'll stick to this block for minimal diff.
                                // Actually, I can't access `hierarchy` from the previous block scope easily without refactoring the whole component body.
                                // To make this simple and robust, I will duplicate the lightweight grouping logic here or mostly rely on filtering.
                                // Filter is cleaner.
                                if (!selectedYear || !selectedMonth) return null

                                const filtered = sections.filter(s => {
                                    const match = s.name.match(/^(\d{4})[\/.]\s?(\d{2})/)
                                    if (match) {
                                        return match[1] === selectedYear && match[2] === selectedMonth
                                    } else {
                                        return selectedYear === 'General' && selectedMonth === 'Others'
                                    }
                                }).sort((a, b) => b.name.localeCompare(a.name))

                                return filtered.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))
                            })()}
                        </select>
                    </div>
                )}

                {uploadType === 'FILE' ? (
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${dragActive
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                        onDragOver={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setDragActive(true)
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setDragActive(false)
                        }}
                        onDrop={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setDragActive(false)
                            if (e.dataTransfer.files?.[0]) {
                                setFile(e.dataTransfer.files[0])
                            }
                        }}
                        onClick={() => document.getElementById('file-upload-input')?.click()}
                    >
                        <input
                            id="file-upload-input"
                            type="file"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <div className="flex flex-col items-center gap-2">
                            {file ? (
                                <>
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                                        <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                        {file.name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                    <p className="text-xs text-blue-500 mt-2">클릭하거나 드래그하여 변경</p>
                                </>
                            ) : (
                                <>
                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                                        <Upload className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                        파일을 이곳에 드래그하거나 클릭하여 선택
                                    </div>
                                    <p className="text-xs text-slate-500">최대 100MB</p>
                                </>
                            )}
                        </div>
                    </div>
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
