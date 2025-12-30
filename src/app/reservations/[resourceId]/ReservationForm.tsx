'use client'

import { useState } from 'react'
import { createReservation } from '@/actions/reservation'

interface ReservationFormProps {
    resourceId: string
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 9) // 9:00 - 20:00

export function ReservationForm({ resourceId }: ReservationFormProps) {
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState('')
    const [startHour, setStartHour] = useState('')
    const [endHour, setEndHour] = useState('')
    const [purpose, setPurpose] = useState('')
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // Get min date (today)
    const today = new Date().toISOString().split('T')[0]

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const formData = new FormData()
        formData.set('resourceId', resourceId)
        formData.set('date', date)
        formData.set('startHour', startHour)
        formData.set('endHour', endHour)
        formData.set('purpose', purpose)

        const result = await createReservation(formData)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: '예약이 완료되었습니다!' })
            // Reset form
            setDate('')
            setStartHour('')
            setEndHour('')
            setPurpose('')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    날짜 *
                </label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={today}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Time range */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        시작 시간 *
                    </label>
                    <select
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">선택</option>
                        {HOURS.map((h) => (
                            <option key={h} value={h}>{h}:00</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        종료 시간 *
                    </label>
                    <select
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">선택</option>
                        {HOURS.map((h) => (
                            <option key={h + 1} value={h + 1}>{h + 1}:00</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Purpose */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    사용 목적
                </label>
                <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="실험, 측정 등"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {loading ? '예약 중...' : '예약하기'}
            </button>
        </form>
    )
}
