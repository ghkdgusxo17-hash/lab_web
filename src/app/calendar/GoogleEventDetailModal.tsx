'use client'

import { useState, useTransition } from 'react'
import { X, Clock, Tag, Star } from 'lucide-react'
import { EVENT_CATEGORIES } from '@/lib/event-categories'
import { saveGoogleEventOverride } from '@/actions/google-calendar'

interface GoogleEventForModal {
    id: string
    title: string
    description: string | null
    startTime: string
    endTime: string
    isAllDay: boolean
    isImportant: boolean
    category: string
    owner: {
        id: string
        name: string | null
        image: string | null
    }
}

interface GoogleEventDetailModalProps {
    isOpen: boolean
    onClose: () => void
    event: GoogleEventForModal | null
    canEdit: boolean
}

export function GoogleEventDetailModal({ isOpen, onClose, event, canEdit }: GoogleEventDetailModalProps) {
    const [category, setCategory] = useState(event?.category || 'OTHER')
    const [isImportant, setIsImportant] = useState(event?.isImportant || false)
    const [isPending, startTransition] = useTransition()
    const [saved, setSaved] = useState(false)

    // Reset state when event changes
    if (event && (category !== event.category || isImportant !== event.isImportant) && !saved) {
        // Only reset if user hasn't saved yet - this handles prop changes
    }

    if (!isOpen || !event) return null

    const handleSave = () => {
        startTransition(async () => {
            const result = await saveGoogleEventOverride(event.id, {
                category: category !== 'OTHER' ? category : null,
                isImportant: isImportant || null,
            })
            if (result.success) {
                setSaved(true)
                setTimeout(() => {
                    setSaved(false)
                    onClose()
                }, 800)
            }
        })
    }

    const hasChanges = category !== event.category || isImportant !== event.isImportant

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded font-bold">G</span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{event.title}</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Time */}
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                        {event.isAllDay ? (
                            <span>하루 종일</span>
                        ) : (
                            <span>
                                {new Date(event.startTime).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                                {' '}
                                {new Date(event.startTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                {' - '}
                                {new Date(event.endTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    {event.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg whitespace-pre-wrap">
                            {event.description}
                        </p>
                    )}

                    {/* Owner */}
                    <div className="flex items-center gap-2">
                        {event.owner.image ? (
                            <img src={event.owner.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                                {event.owner.name?.slice(0, 1) || '?'}
                            </div>
                        )}
                        <span className="text-sm text-slate-600 dark:text-slate-400">{event.owner.name || '알 수 없음'}</span>
                    </div>

                    {/* Editable fields */}
                    {canEdit && (
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            {/* Category */}
                            <div className="flex items-center gap-3">
                                <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <select
                                    value={category}
                                    onChange={(e) => { setCategory(e.target.value); setSaved(false) }}
                                    className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {Object.entries(EVENT_CATEGORIES).map(([key, { label }]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Important */}
                            <div className="flex items-center gap-3">
                                <Star className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <button
                                    onClick={() => { setIsImportant(!isImportant); setSaved(false) }}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                                        isImportant
                                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                    }`}
                                >
                                    <span className={isImportant ? 'text-amber-500' : 'text-slate-300'}>★</span>
                                    {isImportant ? '중요 일정' : '일반 일정'}
                                </button>
                            </div>

                            {/* Save button */}
                            {hasChanges && (
                                <button
                                    onClick={handleSave}
                                    disabled={isPending}
                                    className="w-full py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
                                >
                                    {isPending ? '저장 중...' : saved ? '저장됨!' : '저장'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
