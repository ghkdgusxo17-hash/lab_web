'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createEvent, updateEvent, deleteEvent } from '@/actions/event'
import { EVENT_CATEGORIES } from '@/lib/event-categories'

interface EventFormModalProps {
    isOpen: boolean
    onClose: () => void
    selectedDate?: Date | null
    event?: {
        id: string
        title: string
        description: string | null
        category: string
        startTime: Date
        endTime: Date
        isAllDay: boolean
        createdById: string
    } | null
    currentUserId?: string
    isAdmin?: boolean
}

export function EventFormModal({
    isOpen,
    onClose,
    selectedDate,
    event,
    currentUserId,
    isAdmin,
}: EventFormModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [isAllDay, setIsAllDay] = useState(event?.isAllDay || false)

    const isEditing = !!event
    const canEdit = isEditing && (event.createdById === currentUserId || isAdmin)
    const canDelete = canEdit

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setError('')
            setIsAllDay(event?.isAllDay || false)
        }
    }, [isOpen, event])

    if (!isOpen) return null

    const formatDate = (date: Date) => {
        // Use local date format to avoid timezone issues
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const formatTime = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${hours}:${minutes}`
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        formData.set('isAllDay', isAllDay.toString())

        const result = isEditing
            ? await updateEvent(event.id, formData)
            : await createEvent(formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
            return
        }

        onClose()
        setLoading(false)
    }

    async function handleDelete() {
        if (!event || !confirm('정말 이 일정을 삭제하시겠습니까?')) return

        setLoading(true)
        const result = await deleteEvent(event.id)

        if (result.error) {
            setError(result.error)
            setLoading(false)
            return
        }

        onClose()
        setLoading(false)
    }

    const defaultDate = selectedDate ? formatDate(selectedDate) : formatDate(new Date())

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {isEditing ? '일정 수정' : '새 일정 추가'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            제목 *
                        </label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            required
                            defaultValue={event?.title || ''}
                            placeholder="일정 제목"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            카테고리
                        </label>
                        <select
                            id="category"
                            name="category"
                            defaultValue={event?.category || 'OTHER'}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {Object.entries(EVENT_CATEGORIES).map(([key, { label, color }]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* All Day Toggle */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isAllDay}
                            onChange={(e) => setIsAllDay(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">하루 종일</span>
                    </label>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                시작 날짜 *
                            </label>
                            <input
                                id="startDate"
                                name="startDate"
                                type="date"
                                required
                                defaultValue={event ? formatDate(new Date(event.startTime)) : defaultDate}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        {!isAllDay && (
                            <div>
                                <label htmlFor="startTime" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    시작 시간
                                </label>
                                <input
                                    id="startTime"
                                    name="startTime"
                                    type="time"
                                    defaultValue={event ? formatTime(new Date(event.startTime)) : '09:00'}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                종료 날짜
                            </label>
                            <input
                                id="endDate"
                                name="endDate"
                                type="date"
                                defaultValue={event ? formatDate(new Date(event.endTime)) : defaultDate}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        {!isAllDay && (
                            <div>
                                <label htmlFor="endTime" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    종료 시간
                                </label>
                                <input
                                    id="endTime"
                                    name="endTime"
                                    type="time"
                                    defaultValue={event ? formatTime(new Date(event.endTime)) : '10:00'}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            설명
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            defaultValue={event?.description || ''}
                            placeholder="일정에 대한 설명 (선택)"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4">
                        {isEditing && canDelete ? (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-4 py-2 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                            >
                                삭제
                            </button>
                        ) : (
                            <div />
                        )}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isEditing ? (
                                    '수정'
                                ) : (
                                    '추가'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
