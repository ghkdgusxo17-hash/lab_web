'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X } from 'lucide-react'
import { createInventoryItem, updateInventoryItem } from '@/actions/inventory'

const CATEGORIES = [
    { value: 'REAGENT', label: '시약' },
    { value: 'CONSUMABLE', label: '소모품' },
    { value: 'EQUIPMENT', label: '장비' },
    { value: 'OTHER', label: '기타' },
]

const UNITS = ['개', 'ml', 'L', 'g', 'kg', '박스', '팩', '병', '통', '세트']

interface InventoryItemFormProps {
    item?: {
        id: string
        name: string
        category: string
        quantity: number
        unit: string
        minQuantity: number
        location: string | null
        expiryDate: Date | null
        manufacturer: string | null
        catalogNo: string | null
        purchaseUrl: string | null
        notes: string | null
    }
}

export function InventoryItemForm({ item }: InventoryItemFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(item?.name || '')
    const [category, setCategory] = useState(item?.category || 'OTHER')
    const [quantity, setQuantity] = useState(item?.quantity?.toString() || '0')
    const [unit, setUnit] = useState(item?.unit || '개')
    const [minQuantity, setMinQuantity] = useState(item?.minQuantity?.toString() || '0')
    const [location, setLocation] = useState(item?.location || '')
    const [expiryDate, setExpiryDate] = useState(
        item?.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : ''
    )
    const [manufacturer, setManufacturer] = useState(item?.manufacturer || '')
    const [catalogNo, setCatalogNo] = useState(item?.catalogNo || '')
    const [purchaseUrl, setPurchaseUrl] = useState(item?.purchaseUrl || '')
    const [notes, setNotes] = useState(item?.notes || '')
    const [msdsFile, setMsdsFile] = useState<File | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData()
        formData.set('name', name)
        formData.set('category', category)
        formData.set('quantity', quantity)
        formData.set('unit', unit)
        formData.set('minQuantity', minQuantity)
        formData.set('location', location)
        formData.set('expiryDate', expiryDate)
        formData.set('manufacturer', manufacturer)
        formData.set('catalogNo', catalogNo)
        formData.set('purchaseUrl', purchaseUrl)
        formData.set('notes', notes)
        if (msdsFile) {
            formData.set('msdsFile', msdsFile)
        }

        const result = item
            ? await updateInventoryItem(item.id, formData)
            : await createInventoryItem(formData)

        setLoading(false)

        if (result.error) {
            alert(result.error)
        } else {
            router.push('/inventory/items')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* 품명 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    품명 *
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="품명을 입력하세요"
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

            {/* 수량 & 단위 */}
            {!item && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            초기 수량
                        </label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min={0}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            단위
                        </label>
                        <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            {UNITS.map((u) => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* 최소 재고량 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    최소 재고량 (이하 시 알림)
                </label>
                <input
                    type="number"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    min={0}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0 (알림 없음)"
                />
            </div>

            {/* 보관 위치 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    보관 위치
                </label>
                <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="예: 실험실 A 냉장고"
                />
            </div>

            {/* 유효기간 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    유효기간
                </label>
                <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
            </div>

            {/* 제조사 & 카탈로그 번호 */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        제조사
                    </label>
                    <input
                        type="text"
                        value={manufacturer}
                        onChange={(e) => setManufacturer(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="예: Sigma-Aldrich"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        카탈로그 번호
                    </label>
                    <input
                        type="text"
                        value={catalogNo}
                        onChange={(e) => setCatalogNo(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="예: A1234"
                    />
                </div>
            </div>

            {/* 구매 링크 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    구매 링크
                </label>
                <input
                    type="url"
                    value={purchaseUrl}
                    onChange={(e) => setPurchaseUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="https://..."
                />
            </div>

            {/* MSDS 파일 */}
            {!item && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        MSDS 파일
                    </label>
                    {!msdsFile ? (
                        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                            <Upload className="w-5 h-5 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-400">파일 선택</span>
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => setMsdsFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                        </label>
                    ) : (
                        <div className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span className="flex-1 text-sm text-slate-900 dark:text-white truncate">
                                {msdsFile.name}
                            </span>
                            <button
                                type="button"
                                onClick={() => setMsdsFile(null)}
                                className="p-1 text-slate-400 hover:text-red-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 비고 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    비고
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="추가 메모"
                />
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={loading || !name}
                className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {loading ? '저장 중...' : item ? '수정하기' : '등록하기'}
            </button>
        </form>
    )
}
