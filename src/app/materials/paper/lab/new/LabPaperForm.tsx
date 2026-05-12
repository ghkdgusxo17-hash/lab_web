'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createLabPaper } from '@/actions/paper'
import { UserAvatar } from '@/components/ui/UserAvatar'

const STATUSES = [
    { value: 'WRITING',      label: '작성중' },
    { value: 'SUBMITTED',    label: '투고' },
    { value: 'UNDER_REVIEW', label: '심사중' },
    { value: 'REVISION',     label: '리비전' },
    { value: 'ACCEPTED',     label: '수락' },
    { value: 'PUBLISHED',    label: '게재' },
]

interface Member { id: string; name: string | null; image: string | null; role: string }

export function LabPaperForm({ members }: { members: Member[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [selectedAuthors, setSelectedAuthors] = useState<string[]>([])

    function toggleAuthor(id: string) {
        setSelectedAuthors(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        )
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        selectedAuthors.forEach(id => formData.append('authorIds', id))
        const result = await createLabPaper(formData)
        if (result.error) {
            alert(result.error)
            setLoading(false)
        } else {
            router.push(`/materials/paper/lab/${result.id}`)
        }
    }

    const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
    const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div>
                <label className={labelClass}>제목 *</label>
                <input name="title" required placeholder="논문 제목" className={inputClass} />
            </div>

            {/* 상태 */}
            <div>
                <label className={labelClass}>진행 상태</label>
                <div className="flex flex-wrap gap-2">
                    {STATUSES.map(s => (
                        <label key={s.value} className="cursor-pointer">
                            <input type="radio" name="status" value={s.value} defaultChecked={s.value === 'WRITING'} className="sr-only peer" />
                            <span className="px-4 py-2 rounded-full text-sm font-medium border border-slate-200 dark:border-slate-700 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 text-slate-600 dark:text-slate-400 hover:border-slate-300 transition-all">
                                {s.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* 저널 / 연도 / DOI */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div>
                    <label className={labelClass}>저널/학회명</label>
                    <input name="journal" placeholder="예: IEEE Transactions..." className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>연도</label>
                    <input name="year" type="number" placeholder="2025" min="2000" max="2100" className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>DOI</label>
                    <input name="doi" placeholder="10.xxxx/xxxxx" className={inputClass} />
                </div>
            </div>

            {/* 초록 */}
            <div>
                <label className={labelClass}>초록</label>
                <textarea name="abstract" rows={4} placeholder="논문 초록을 입력하세요" className={`${inputClass} resize-none`} />
            </div>

            {/* 논문 파일 */}
            <div>
                <label className={labelClass}>논문 파일 (PDF)</label>
                <input
                    name="file"
                    type="file"
                    accept=".pdf,.doc,.docx,.tex"
                    className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/20 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30 transition-all"
                />
                <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, TEX 파일 지원 (최대 100MB)</p>
            </div>

            {/* 공저자 */}
            {members.length > 0 && (
                <div>
                    <label className={labelClass}>공저자 (랩 멤버)</label>
                    <div className="flex flex-wrap gap-2">
                        {members.map(m => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => toggleAuthor(m.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                                    selectedAuthors.includes(m.id)
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                }`}
                            >
                                <UserAvatar src={m.image} name={m.name} size={16} />
                                {m.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {loading ? '등록 중...' : '논문 등록'}
            </button>
        </form>
    )
}
