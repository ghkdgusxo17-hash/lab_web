'use client'

import { useState, useRef } from 'react'
import { BookOpen, Plus, Trash2, Edit2, Star, X, ExternalLink, Upload } from 'lucide-react'
import { createPublication, updatePublication, deletePublication, bulkCreatePublications } from '@/actions/publication'

interface Publication {
    id: string
    type: string
    title: string
    authors: string
    year: number
    journal: string | null
    volume: string | null
    pages: string | null
    doi: string | null
    patentNo: string | null
    link: string | null
    isHighlight: boolean
}

interface PublicationManagerProps {
    publications: Publication[]
}

const TYPES = [
    { value: 'JOURNAL', label: '저널 논문' },
    { value: 'CONFERENCE', label: '학술대회' },
    { value: 'PATENT', label: '특허' },
]

export function PublicationManager({ publications: initialPublications }: PublicationManagerProps) {
    const [publications, setPublications] = useState(initialPublications)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        type: 'JOURNAL',
        title: '',
        authors: '',
        year: new Date().getFullYear(),
        journal: '',
        volume: '',
        pages: '',
        doi: '',
        patentNo: '',
        link: '',
        isHighlight: false
    })

    const resetForm = () => {
        setFormData({
            type: 'JOURNAL',
            title: '',
            authors: '',
            year: new Date().getFullYear(),
            journal: '',
            volume: '',
            pages: '',
            doi: '',
            patentNo: '',
            link: '',
            isHighlight: false
        })
        setEditingId(null)
        setShowForm(false)
    }

    const handleEdit = (pub: Publication) => {
        setFormData({
            type: pub.type,
            title: pub.title,
            authors: pub.authors,
            year: pub.year,
            journal: pub.journal || '',
            volume: pub.volume || '',
            pages: pub.pages || '',
            doi: pub.doi || '',
            patentNo: pub.patentNo || '',
            link: pub.link || '',
            isHighlight: pub.isHighlight
        })
        setEditingId(pub.id)
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (editingId) {
                const updated = await updatePublication(editingId, formData)
                setPublications(publications.map(p => p.id === editingId ? updated : p))
            } else {
                const created = await createPublication(formData)
                setPublications([created, ...publications])
            }
            resetForm()
        } catch (error) {
            alert('저장에 실패했습니다')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return

        try {
            await deletePublication(id)
            setPublications(publications.filter(p => p.id !== id))
        } catch (error) {
            alert('삭제에 실패했습니다')
        }
    }

    const getTypeLabel = (type: string) => {
        const found = TYPES.find(t => t.value === type)
        return found?.label || type
    }

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const text = await file.text()
            const data = JSON.parse(text)

            if (!Array.isArray(data)) {
                alert('JSON 파일은 배열 형식이어야 합니다')
                return
            }

            setLoading(true)
            const result = await bulkCreatePublications(data)

            if (result.error) {
                alert(result.error)
            } else {
                alert(`${result.created}개 등록 완료, ${result.skipped}개 중복/오류로 건너뜀`)
                // Refresh page to get updated list
                window.location.reload()
            }
        } catch (error) {
            alert('JSON 파일 파싱 오류')
        } finally {
            setLoading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    return (
        <section className="bg-white dark:bg-slate-900 t-rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-10">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    학술 논문 관리
                </h2>
                <div className="flex gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium t-rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        JSON 일괄등록
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn-primary px-4 py-2 text-white text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        새 논문
                    </button>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 t-rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {editingId ? '논문/특허 수정' : '새 논문/특허 등록'}
                            </h3>
                            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">유형</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-3 py-2 t-rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    >
                                        {TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">연도</label>
                                    <input
                                        type="number"
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 t-rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">제목</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 t-rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="논문/특허 제목"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">저자</label>
                                <input
                                    type="text"
                                    value={formData.authors}
                                    onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                                    className="w-full px-3 py-2 t-rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="홍길동, 김철수, ..."
                                    required
                                />
                            </div>

                            {formData.type !== 'PATENT' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">저널/학회명</label>
                                        <input
                                            type="text"
                                            value={formData.journal}
                                            onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                                            className="w-full px-3 py-2 t-rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="Journal of Chemical Engineering"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Volume</label>
                                            <input
                                                type="text"
                                                value={formData.volume}
                                                onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                                                className="w-full px-3 py-2 t-rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pages</label>
                                            <input
                                                type="text"
                                                value={formData.pages}
                                                onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                                                className="w-full px-3 py-2 t-rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                placeholder="123-145"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">DOI</label>
                                            <input
                                                type="text"
                                                value={formData.doi}
                                                onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                                                className="w-full px-3 py-2 t-rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                placeholder="10.1000/xyz123"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">특허번호</label>
                                    <input
                                        type="text"
                                        value={formData.patentNo}
                                        onChange={(e) => setFormData({ ...formData, patentNo: e.target.value })}
                                        className="w-full px-3 py-2 t-rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="10-2024-0000000"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">외부 링크</label>
                                <input
                                    type="url"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full px-3 py-2 t-rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="https://..."
                                />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isHighlight}
                                    onChange={(e) => setFormData({ ...formData, isHighlight: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <Star className={`w-4 h-4 ${formData.isHighlight ? 'text-yellow-500' : 'text-slate-400'}`} />
                                <span className="text-sm text-slate-700 dark:text-slate-300">주요 연구 성과로 표시</span>
                            </label>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 py-2 t-rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 btn-primary py-2 text-white"
                                >
                                    {loading ? '저장 중...' : (editingId ? '수정' : '등록')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            {publications.length === 0 ? (
                <p className="text-center text-slate-500 py-8">등록된 논문/특허가 없습니다</p>
            ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {publications.map((pub) => (
                        <div
                            key={pub.id}
                            className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 t-rounded-lg"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold px-2 py-0.5 t-rounded-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                        {getTypeLabel(pub.type)}
                                    </span>
                                    <span className="text-xs text-slate-500">{pub.year}</span>
                                    {pub.isHighlight && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                </div>
                                <h4 className="font-medium text-slate-900 dark:text-white text-sm line-clamp-1">{pub.title}</h4>
                                <p className="text-xs text-slate-500 line-clamp-1">{pub.authors}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                {(pub.doi || pub.link) && (
                                    <a
                                        href={pub.doi ? `https://doi.org/${pub.doi}` : pub.link || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-slate-400 hover:text-blue-500"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                                <button onClick={() => handleEdit(pub)} className="p-2 text-slate-400 hover:text-blue-500">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(pub.id)} className="p-2 text-slate-400 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
