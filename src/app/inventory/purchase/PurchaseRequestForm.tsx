'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { createPurchaseRequest } from '@/actions/inventory'

const CATEGORIES = [
    { value: 'REAGENT', label: '시약' },
    { value: 'EQUIPMENT', label: '장비' },
    { value: 'OFFICE', label: '사무용품' },
    { value: 'TRAVEL', label: '출장' },
    { value: 'OTHER', label: '기타' },
]

interface PurchaseItem {
    name: string
    quantity: number
    unitPrice: number
    url: string
}

export function PurchaseRequestForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('OTHER')
    const [priority, setPriority] = useState('NORMAL')
    const [items, setItems] = useState<PurchaseItem[]>([{ name: '', quantity: 1, unitPrice: 0, url: '' }])
    const [quotationFile, setQuotationFile] = useState<File | null>(null)

    const estimatedCost = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

    function addItem() {
        setItems([...items, { name: '', quantity: 1, unitPrice: 0, url: '' }])
    }

    function removeItem(index: number) {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index))
        }
    }

    function updateItem(index: number, field: keyof PurchaseItem, value: string | number) {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData()
        formData.set('title', title)
        formData.set('description', description)
        formData.set('category', category)
        formData.set('priority', priority)
        formData.set('estimatedCost', estimatedCost.toString())
        formData.set('items', JSON.stringify(items.filter(item => item.name)))
        if (quotationFile) {
            formData.set('quotationFile', quotationFile)
        }

        const result = await createPurchaseRequest(formData)

        setLoading(false)

        if (result.error) {
            alert(result.error)
        } else {
            router.push('/inventory/purchase')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
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
                    placeholder="구매 요청 제목"
                />
            </div>

            {/* 카테고리 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    카테고리
                </label>
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
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

            {/* 우선순위 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    우선순위
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setPriority('NORMAL')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${priority === 'NORMAL'
                                ? 'bg-slate-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                    >
                        일반
                    </button>
                    <button
                        type="button"
                        onClick={() => setPriority('URGENT')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${priority === 'URGENT'
                                ? 'bg-red-600 text-white'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                            }`}
                    >
                        <AlertTriangle className="w-4 h-4" />
                        긴급
                    </button>
                </div>
            </div>

            {/* 품목 리스트 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    구매 품목
                </label>
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={index} className="flex gap-2 items-start p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                    placeholder="품명"
                                    className="col-span-2 md:col-span-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                />
                                <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                    min={1}
                                    placeholder="수량"
                                    className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                />
                                <input
                                    type="number"
                                    value={item.unitPrice || ''}
                                    onChange={(e) => updateItem(index, 'unitPrice', parseInt(e.target.value) || 0)}
                                    placeholder="단가 (원)"
                                    className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                />
                                <input
                                    type="url"
                                    value={item.url}
                                    onChange={(e) => updateItem(index, 'url', e.target.value)}
                                    placeholder="구매 링크 (선택)"
                                    className="col-span-2 md:col-span-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                />
                            </div>
                            {items.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="p-2 text-slate-400 hover:text-red-500"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                        품목 추가
                    </button>
                </div>
            </div>

            {/* 예상 금액 */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700 dark:text-slate-300">예상 총액</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {new Intl.NumberFormat('ko-KR').format(estimatedCost)}원
                    </span>
                </div>
            </div>

            {/* 설명 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    설명 (선택)
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="구매 이유나 추가 설명"
                />
            </div>

            {/* 견적서 파일 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    견적서 첨부 (선택)
                </label>
                {!quotationFile ? (
                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-400">파일 선택</span>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => setQuotationFile(e.target.files?.[0] || null)}
                            className="hidden"
                        />
                    </label>
                ) : (
                    <div className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="flex-1 text-sm text-slate-900 dark:text-white truncate">
                            {quotationFile.name}
                        </span>
                        <button
                            type="button"
                            onClick={() => setQuotationFile(null)}
                            className="p-1 text-slate-400 hover:text-red-500"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={loading || !title || estimatedCost <= 0}
                className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {loading ? '요청 중...' : '구매 요청하기'}
            </button>
        </form>
    )
}
