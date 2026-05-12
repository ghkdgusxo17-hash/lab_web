'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Calendar, Check, X, RefreshCw, Unlink, Star } from 'lucide-react'
import { saveCalendarSyncSettings, disconnectGoogleCalendar } from '@/actions/google-calendar'
import { EVENT_CATEGORIES } from '@/lib/event-categories'

interface GoogleCalendarInfo {
    id: string
    summary: string
    description?: string
    backgroundColor?: string
    primary?: boolean
}

interface SyncConfig {
    calendarId: string
    calendarName: string
    isShared: boolean
    color: string | null
    category: string
    isImportant: boolean
}

interface GoogleCalendarSettingsProps {
    connected: boolean
    calendars: GoogleCalendarInfo[]
    syncConfigs: SyncConfig[]
}

export function GoogleCalendarSettings({ connected, calendars, syncConfigs }: GoogleCalendarSettingsProps) {
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // Handle callback messages from OAuth redirect
    useEffect(() => {
        const calendarSuccess = searchParams.get('calendar_success')
        const calendarError = searchParams.get('calendar_error')

        if (calendarSuccess) {
            setMessage({ type: 'success', text: 'Google Calendar 연동이 완료되었습니다!' })
            // Clean up URL params
            window.history.replaceState({}, '', '/settings')
        } else if (calendarError) {
            setMessage({ type: 'error', text: calendarError })
            window.history.replaceState({}, '', '/settings')
        }
    }, [searchParams])

    // Initialize local state from saved configs
    const initialSharedMap = new Map(syncConfigs.map(c => [c.calendarId, c.isShared]))
    const initialColorMap = new Map(syncConfigs.map(c => [c.calendarId, c.color]))
    const initialCategoryMap = new Map(syncConfigs.map(c => [c.calendarId, c.category]))
    const initialImportantMap = new Map(syncConfigs.map(c => [c.calendarId, c.isImportant]))

    const [sharedMap, setSharedMap] = useState<Map<string, boolean>>(initialSharedMap)
    const [colorMap, setColorMap] = useState<Map<string, string | null>>(initialColorMap)
    const [categoryMap, setCategoryMap] = useState<Map<string, string>>(initialCategoryMap)
    const [importantMap, setImportantMap] = useState<Map<string, boolean>>(initialImportantMap)
    const [hasChanges, setHasChanges] = useState(false)

    function toggleCalendarShared(calendarId: string) {
        setSharedMap(prev => {
            const next = new Map(prev)
            next.set(calendarId, !next.get(calendarId))
            return next
        })
        setHasChanges(true)
    }

    function setCalendarColor(calendarId: string, color: string) {
        setColorMap(prev => {
            const next = new Map(prev)
            next.set(calendarId, color)
            return next
        })
        setHasChanges(true)
    }

    function setCalendarCategory(calendarId: string, category: string) {
        setCategoryMap(prev => {
            const next = new Map(prev)
            next.set(calendarId, category)
            return next
        })
        // Auto-apply category color
        const catColor = EVENT_CATEGORIES[category as keyof typeof EVENT_CATEGORIES]?.color
        if (catColor) {
            setColorMap(prev => {
                const next = new Map(prev)
                next.set(calendarId, catColor)
                return next
            })
        }
        setHasChanges(true)
    }

    function toggleCalendarImportant(calendarId: string) {
        setImportantMap(prev => {
            const next = new Map(prev)
            next.set(calendarId, !next.get(calendarId))
            return next
        })
        setHasChanges(true)
    }

    async function handleSave() {
        setLoading(true)
        setMessage(null)

        // Build settings from selected calendars
        const settings = calendars
            .filter(cal => sharedMap.get(cal.id))
            .map(cal => ({
                calendarId: cal.id,
                calendarName: cal.summary,
                isShared: true,
                color: colorMap.get(cal.id) || cal.backgroundColor || null,
                category: categoryMap.get(cal.id) || 'OTHER',
                isImportant: importantMap.get(cal.id) || false,
            }))

        // Also include calendars that are tracked but not shared (for personal view)
        const unsharedConfigs = calendars
            .filter(cal => !sharedMap.get(cal.id) && syncConfigs.some(s => s.calendarId === cal.id))
            .map(cal => ({
                calendarId: cal.id,
                calendarName: cal.summary,
                isShared: false,
                color: colorMap.get(cal.id) || cal.backgroundColor || null,
                category: categoryMap.get(cal.id) || 'OTHER',
                isImportant: importantMap.get(cal.id) || false,
            }))

        const result = await saveCalendarSyncSettings([...settings, ...unsharedConfigs])

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: '설정이 저장되었습니다.' })
            setHasChanges(false)
        }
        setLoading(false)
    }

    async function handleDisconnect() {
        if (!confirm('Google Calendar 연동을 해제하시겠습니까? 공유 설정이 모두 삭제됩니다.')) return

        setLoading(true)
        const result = await disconnectGoogleCalendar()
        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: '연동이 해제되었습니다.' })
        }
        setLoading(false)
    }

    function handleConnect() {
        // Redirect to separate Google Calendar OAuth flow
        window.location.href = '/api/google-calendar/connect'
    }

    const PRESET_COLORS = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#22C55E',
    ]

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Google Calendar 연동
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Google 캘린더의 일정을 공유 캘린더에 표시합니다
                    </p>
                </div>
            </div>

            {message && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                    message.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                }`}>
                    {message.text}
                </div>
            )}

            {!connected ? (
                <div className="mt-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Google 계정을 연동하면 캘린더의 일정을 다른 멤버와 공유할 수 있습니다.
                        공유할 캘린더를 선택할 수 있어 개인 일정은 비공개로 유지됩니다.
                    </p>
                    <button
                        onClick={handleConnect}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        )}
                        Google 계정 연동
                    </button>
                    <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                        * Google 로그인 시 캘린더 읽기 권한을 요청합니다 (읽기 전용)
                    </p>
                </div>
            ) : (
                <div className="mt-6 space-y-4">
                    {/* Connected status */}
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-green-600 dark:text-green-400 font-medium">연동됨</span>
                    </div>

                    {/* Calendar list */}
                    {calendars.length > 0 ? (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                공유할 캘린더를 선택하세요:
                            </p>
                            {calendars.map((cal) => {
                                const isShared = sharedMap.get(cal.id) || false
                                const color = colorMap.get(cal.id) || cal.backgroundColor || '#3B82F6'
                                const category = categoryMap.get(cal.id) || 'OTHER'
                                const isImportant = importantMap.get(cal.id) || false

                                return (
                                    <div
                                        key={cal.id}
                                        className={`p-3 rounded-xl border transition-all ${
                                            isShared
                                                ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
                                                : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                                        }`}
                                    >
                                        {/* Top row: toggle + name */}
                                        <div className="flex items-center gap-3">
                                            {/* Share Toggle */}
                                            <button
                                                onClick={() => toggleCalendarShared(cal.id)}
                                                className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${
                                                    isShared ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
                                                }`}
                                            >
                                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                                                    isShared ? 'translate-x-4' : 'translate-x-0'
                                                }`} />
                                            </button>

                                            {/* Color indicator */}
                                            <div
                                                className="w-4 h-4 rounded-full flex-shrink-0 cursor-pointer relative group"
                                                style={{ backgroundColor: color }}
                                            >
                                                <div className="absolute left-0 top-6 hidden group-hover:flex gap-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10">
                                                    {PRESET_COLORS.map((c) => (
                                                        <button
                                                            key={c}
                                                            onClick={() => setCalendarColor(cal.id, c)}
                                                            className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
                                                                color === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''
                                                            }`}
                                                            style={{ backgroundColor: c }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Calendar name */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                    {cal.summary}
                                                    {cal.primary && (
                                                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded font-bold">기본</span>
                                                    )}
                                                </p>
                                            </div>

                                            {isShared ? (
                                                <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                            ) : (
                                                <X className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                                            )}
                                        </div>

                                        {/* Bottom row: category + important (only when shared) */}
                                        {isShared && (
                                            <div className="flex items-center gap-3 mt-2.5 ml-[52px]">
                                                {/* Category */}
                                                <select
                                                    value={category}
                                                    onChange={(e) => setCalendarCategory(cal.id, e.target.value)}
                                                    className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                >
                                                    {Object.entries(EVENT_CATEGORIES).map(([key, { label }]) => (
                                                        <option key={key} value={key}>{label}</option>
                                                    ))}
                                                </select>

                                                {/* Important toggle */}
                                                <button
                                                    onClick={() => toggleCalendarImportant(cal.id)}
                                                    className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                                                        isImportant
                                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                                    }`}
                                                >
                                                    <span>{isImportant ? '★' : '☆'}</span>
                                                    중요
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            캘린더를 불러올 수 없습니다. 연동을 다시 시도해주세요.
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleConnect}
                                disabled={loading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                다시 연동
                            </button>
                            <button
                                onClick={handleDisconnect}
                                disabled={loading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Unlink className="w-3.5 h-3.5" />
                                연동 해제
                            </button>
                        </div>
                        {hasChanges && (
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '저장'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
