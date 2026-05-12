'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X } from 'lucide-react'
import { createReadingPaper } from '@/actions/paper'

export function ReadingPaperForm() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(false)
    const [pptFile, setPptFile] = useState<File | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        if (pptFile) formData.set('pptFile', pptFile)
        const result = await createReadingPaper(formData)
        if (result.error) {
            alert(result.error)
            setLoading(false)
        } else {
            router.push('/materials/paper/reading')
        }
    }

    const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
    const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div>
                <label className={labelClass}>논문 제목 *</label>
                <input name="title" required placeholder="논문 제목" className={inputClass} />
            </div>

            {/* 저자 / 연도 */}
            <div className="grid sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>저자</label>
                    <input name="authors" placeholder="예: Kim et al., Zhang J..." className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>출판 연도</label>
                    <input name="year" type="number" placeholder="2025" min="1900" max="2100" className={inputClass} />
                </div>
            </div>

            {/* 외부 링크 */}
            <div>
                <label className={labelClass}>논문 링크 (DOI/arXiv)</label>
                <input name="externalUrl" type="url" placeholder="https://doi.org/..." className={inputClass} />
            </div>

            {/* 초록/요약 */}
            <div>
                <label className={labelClass}>초록 / 읽은 소감</label>
                <textarea name="abstract" rows={4} placeholder="논문 초록이나 읽은 소감을 입력하세요" className={`${inputClass} resize-none`} />
            </div>

            {/* 발표자료 */}
            <div>
                <label className={labelClass}>발표자료 (선택)</label>
                {!pptFile ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-green-500 dark:hover:border-green-500 transition-colors"
                    >
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">클릭하여 발표자료 선택</p>
                        <p className="text-xs text-slate-400 mt-1">PPT, PDF 등</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                        <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1">{pptFile.name}</span>
                        <button type="button" onClick={() => setPptFile(null)} className="text-slate-400 hover:text-red-500">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <input ref={fileInputRef} type="file" onChange={e => setPptFile(e.target.files?.[0] ?? null)} className="hidden" />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {loading ? '등록 중...' : '논문 등록'}
            </button>
        </form>
    )
}
