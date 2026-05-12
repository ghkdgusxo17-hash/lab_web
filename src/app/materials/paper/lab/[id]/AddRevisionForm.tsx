'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X } from 'lucide-react'
import { addPaperRevision } from '@/actions/paper'

export function AddRevisionForm({ paperId }: { paperId: string }) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [note, setNote] = useState('')

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        setFile(e.target.files?.[0] ?? null)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!file) return alert('파일을 선택해주세요.')
        setLoading(true)
        const formData = new FormData()
        formData.set('paperId', paperId)
        formData.set('note', note)
        formData.set('file', file)
        const result = await addPaperRevision(formData)
        if (result.error) {
            alert(result.error)
            setLoading(false)
        } else {
            setOpen(false)
            setFile(null)
            setNote('')
            router.refresh()
        }
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
            >
                <Upload className="w-4 h-4" />
                리비전 추가
            </button>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800 p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">리비전 파일 추가</span>
                <button type="button" onClick={() => { setOpen(false); setFile(null) }} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {!file ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-orange-300 dark:border-orange-700 rounded-xl p-6 text-center cursor-pointer hover:border-orange-500 transition-colors"
                >
                    <Upload className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">클릭하여 파일 선택</p>
                </div>
            ) : (
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <FileText className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1">{file.name}</span>
                    <button type="button" onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />

            <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="리비전 설명 (선택)"
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />

            <button
                type="submit"
                disabled={loading || !file}
                className="w-full py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {loading ? '업로드 중...' : '업로드'}
            </button>
        </form>
    )
}
