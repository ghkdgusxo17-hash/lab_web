'use client'

import { useState, useCallback } from 'react'
import { Session } from 'next-auth'
import { NavbarClient } from '@/components/layout/NavbarClient'
import { EventFormModal } from './EventFormModal'
import { GoogleEventDetailModal } from './GoogleEventDetailModal'
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar as CalendarIcon, Edit2, TableProperties, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { EVENT_CATEGORIES } from '@/lib/event-categories'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

// Colors for member calendars
const MEMBER_COLORS = [
    '#F97316', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B',
    '#6366F1', '#EF4444', '#22C55E', '#3B82F6', '#A855F7',
]

interface CalendarEvent {
    id: string
    title: string
    description: string | null
    category: string
    startTime: string
    endTime: string
    isAllDay: boolean
    isImportant?: boolean
    color: string | null
    createdById: string
    createdBy: {
        id: string
        name: string | null
        image: string | null
    }
}

interface GoogleCalendarEvent {
    id: string
    title: string
    description: string | null
    startTime: string
    endTime: string
    isAllDay: boolean
    isImportant: boolean
    category: string
    source: 'google'
    googleCalendarId: string
    owner: {
        id: string
        name: string | null
        image: string | null
    }
    color: string | null
}

interface ConnectedMember {
    id: string
    name: string | null
    image: string | null
    sharedCalendarCount: number
}

// Unified event type for display
type DisplayEvent = (CalendarEvent & { source: 'db' }) | GoogleCalendarEvent

interface CalendarClientWithEventsProps {
    session: Session | null
    events: CalendarEvent[]
    googleEvents: GoogleCalendarEvent[]
    connectedMembers: ConnectedMember[]
}

export function CalendarClientWithEvents({ session, events, googleEvents, connectedMembers }: CalendarClientWithEventsProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
    const [selectedGoogleEvent, setSelectedGoogleEvent] = useState<GoogleCalendarEvent | null>(null)

    // Member filter state: which members' Google events to show
    const [visibleMembers, setVisibleMembers] = useState<Set<string>>(
        new Set(connectedMembers.map(m => m.id))
    )
    const [showGoogleEvents, setShowGoogleEvents] = useState(true)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const startingDay = firstDayOfMonth.getDay()
    const totalDays = lastDayOfMonth.getDate()

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
    const goToToday = () => {
        setCurrentDate(new Date())
        setSelectedDate(new Date())
    }

    // Assign colors to members
    const memberColorMap = new Map<string, string>()
    connectedMembers.forEach((member, idx) => {
        memberColorMap.set(member.id, member.id === session?.user?.id
            ? '#3B82F6' // blue for self
            : MEMBER_COLORS[idx % MEMBER_COLORS.length])
    })

    // Filter Google events by visible members
    const filteredGoogleEvents = showGoogleEvents
        ? googleEvents.filter(e => visibleMembers.has(e.owner.id))
        : []

    // Combine all events for display
    const allDisplayEvents: DisplayEvent[] = [
        ...events.map(e => ({ ...e, source: 'db' as const })),
        ...filteredGoogleEvents,
    ]

    const getEventsForDate = (date: Date): DisplayEvent[] => {
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

        return allDisplayEvents.filter((event) => {
            const startDate = new Date(event.startTime)
            const endDate = new Date(event.endTime)

            const eventStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
            const eventEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())

            return targetDate >= eventStart && targetDate <= eventEnd
        })
    }

    const isToday = (day: number) => {
        const today = new Date()
        return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
    }

    const isSelected = (day: number) => {
        if (!selectedDate) return false
        return selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day
    }

    const hasImportantEvent = (day: number) => {
        const date = new Date(year, month, day)
        const dayEvents = getEventsForDate(date)
        return dayEvents.some(e => {
            if (e.source === 'db' && 'isImportant' in e) return e.isImportant
            if (e.source === 'google') return e.isImportant
            return false
        })
    }

    const handleHoloMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const mx = ((e.clientX - rect.left) / rect.width) * 100
        const my = ((e.clientY - rect.top) / rect.height) * 100
        e.currentTarget.style.setProperty('--mx', `${mx}%`)
        e.currentTarget.style.setProperty('--my', `${my}%`)
    }, [])

    const handleHoloMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.setProperty('--mx', '50%')
        e.currentTarget.style.setProperty('--my', '50%')
    }, [])

    const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

    const calendarDays: (number | null)[] = []
    for (let i = 0; i < startingDay; i++) calendarDays.push(null)
    for (let day = 1; day <= totalDays; day++) calendarDays.push(day)

    const canCreateEvent = session?.user && (session.user.isAdmin || session.user.isApproved)

    function openAddModal() {
        setSelectedEvent(null)
        setIsModalOpen(true)
    }

    function openEditModal(event: CalendarEvent) {
        setSelectedEvent(event)
        setIsModalOpen(true)
    }

    function closeModal() {
        setIsModalOpen(false)
        setSelectedEvent(null)
    }

    function toggleMember(memberId: string) {
        setVisibleMembers(prev => {
            const next = new Set(prev)
            if (next.has(memberId)) {
                next.delete(memberId)
            } else {
                next.add(memberId)
            }
            return next
        })
    }

    function getEventColor(event: DisplayEvent): string {
        if (event.source === 'google') {
            // Use category color if set, then saved color, then member color
            const categoryColor = event.category !== 'OTHER'
                ? EVENT_CATEGORIES[event.category as keyof typeof EVENT_CATEGORIES]?.color
                : null
            return event.color || categoryColor || memberColorMap.get(event.owner.id) || '#9CA3AF'
        }
        return event.color || '#6B7280'
    }

    const upcomingEvents = allDisplayEvents
        .filter((e) => new Date(e.startTime) >= new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 5)

    return (
        <>
            <NavbarClient session={session} />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                            캘린더
                        </h1>
                        <div className="flex items-center gap-4">
                            <p className="text-lg text-slate-600 dark:text-slate-300">
                                연구실의 주요 일정과 이벤트를 확인하세요
                            </p>
                            <Link
                                href="/timetable"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                            >
                                <TableProperties className="w-4 h-4" />
                                시간표
                            </Link>
                        </div>
                    </div>

                    {/* Member Filter Bar */}
                    {connectedMembers.length > 0 && (
                        <div className="mb-6 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    Google 캘린더
                                </span>

                                {/* Toggle all Google events */}
                                <button
                                    onClick={() => setShowGoogleEvents(!showGoogleEvents)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                                        showGoogleEvents
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                    }`}
                                >
                                    {showGoogleEvents ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    전체
                                </button>

                                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

                                {/* Per-member toggle */}
                                {connectedMembers.map((member) => {
                                    const color = memberColorMap.get(member.id) || '#9CA3AF'
                                    const isVisible = visibleMembers.has(member.id) && showGoogleEvents

                                    return (
                                        <button
                                            key={member.id}
                                            onClick={() => toggleMember(member.id)}
                                            disabled={!showGoogleEvents}
                                            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                                                isVisible
                                                    ? 'text-white shadow-sm'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                            }`}
                                            style={isVisible ? { backgroundColor: color } : undefined}
                                        >
                                            {member.image ? (
                                                <img src={member.image} alt="" className="w-4 h-4 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[8px] font-bold">
                                                    {member.name?.slice(0, 1) || '?'}
                                                </div>
                                            )}
                                            {member.name || '알 수 없음'}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Calendar */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {year}년 {MONTHS[month]}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={goToToday}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                    >
                                        오늘
                                    </button>
                                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                                        <button
                                            onClick={prevMonth}
                                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all shadow-sm"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={nextMonth}
                                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all shadow-sm"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Days of week */}
                            <div className="grid grid-cols-7 mb-4">
                                {DAYS.map((day, index) => (
                                    <div
                                        key={day}
                                        className={`text-center text-sm font-bold py-2 uppercase tracking-wider ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-slate-400'
                                            }`}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-2">
                                {calendarDays.map((day, index) => {
                                    if (day === null) return <div key={`empty-${index}`} className="aspect-square" />

                                    const date = new Date(year, month, day)
                                    const dayEvents = getEventsForDate(date)
                                    const dayOfWeek = date.getDay()
                                    const isImportantDay = hasImportantEvent(day)

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => setSelectedDate(date)}
                                            onMouseMove={isImportantDay ? handleHoloMouseMove : undefined}
                                            onMouseLeave={isImportantDay ? handleHoloMouseLeave : undefined}
                                            className={`relative min-h-[80px] p-1.5 rounded-xl transition-all duration-200 group flex flex-col ${isSelected(day)
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02] z-10'
                                                : isToday(day)
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500 ring-inset'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                                } ${isImportantDay && !isSelected(day) ? 'holo-cell' : ''}`}
                                            style={isImportantDay ? { '--mx': '50%', '--my': '50%' } as React.CSSProperties : undefined}
                                        >
                                            {/* Holographic overlay */}
                                            {isImportantDay && !isSelected(day) && (
                                                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                                                    <div
                                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                        style={{
                                                            background: `radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,200,0,0.15), rgba(120,80,255,0.1), rgba(0,200,255,0.08), transparent 70%)`,
                                                        }}
                                                    />
                                                    <div
                                                        className="absolute inset-0 opacity-0 group-hover:opacity-60 transition-opacity duration-300"
                                                        style={{
                                                            background: `conic-gradient(from 0deg at var(--mx, 50%) var(--my, 50%), #ff000015, #ff800015, #ffff0015, #00ff0015, #0080ff15, #8000ff15, #ff000015)`,
                                                            mixBlendMode: 'overlay',
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 rounded-xl ring-1 ring-amber-400/30 group-hover:ring-amber-400/60 transition-all" />
                                                </div>
                                            )}
                                            <span
                                                className={`text-sm font-bold mb-1 relative z-10 ${!isSelected(day) && dayOfWeek === 0 ? 'text-red-500' :
                                                    !isSelected(day) && dayOfWeek === 6 ? 'text-blue-500' : ''
                                                    } ${isImportantDay && !isSelected(day) ? 'flex items-center gap-0.5' : ''}`}
                                            >
                                                {day}
                                                {isImportantDay && !isSelected(day) && (
                                                    <span className="text-amber-500 text-[10px]">★</span>
                                                )}
                                            </span>
                                            {dayEvents.length > 0 && (
                                                <div className="flex-1 flex flex-col gap-0.5 w-full overflow-hidden relative z-10">
                                                    {dayEvents.slice(0, 2).map((event) => (
                                                        <div
                                                            key={event.id}
                                                            className={`w-full px-1 py-0.5 rounded text-[10px] font-medium truncate ${isSelected(day) ? 'bg-white/30 text-white' : 'text-white'
                                                                } ${event.source === 'google' ? 'border border-dashed border-white/40' : ''}`}
                                                            style={{ backgroundColor: isSelected(day) ? undefined : getEventColor(event) }}
                                                        >
                                                            {event.source === 'google' && (
                                                                <span className="mr-0.5 opacity-70">G</span>
                                                            )}
                                                            {event.title}
                                                        </div>
                                                    ))}
                                                    {dayEvents.length > 2 && (
                                                        <span className={`text-[10px] font-medium ${isSelected(day) ? 'text-white/80' : 'text-slate-400'}`}>
                                                            +{dayEvents.length - 2}개
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Legend */}
                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                    {Object.entries(EVENT_CATEGORIES).map(([key, { label, color }]) => (
                                        <div key={key} className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-amber-500 text-xs">★</span>
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">중요 일정</span>
                                    </div>
                                    {connectedMembers.length > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded border border-dashed border-slate-400 bg-slate-300" />
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Google 캘린더</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                        {selectedDate
                                            ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`
                                            : '날짜를 선택하세요'}
                                    </h3>
                                    {canCreateEvent && (
                                        <button
                                            onClick={openAddModal}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-bold rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            추가
                                        </button>
                                    )}
                                </div>

                                {selectedDate ? (
                                    selectedDateEvents.length > 0 ? (
                                        <div className="space-y-4">
                                            {selectedDateEvents.map((event) => {
                                                const isGoogle = event.source === 'google'
                                                const eventColor = getEventColor(event)

                                                return (
                                                    <div
                                                        key={event.id}
                                                        className={`group p-4 rounded-2xl border-l-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all cursor-pointer ${isGoogle ? 'border-dashed' : ''}`}
                                                        style={{ borderLeftColor: eventColor }}
                                                        onClick={() => {
                                                            if (isGoogle) {
                                                                setSelectedGoogleEvent(event as GoogleCalendarEvent)
                                                            } else if (event.source === 'db') {
                                                                openEditModal(event)
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                                {isGoogle && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded font-bold">G</span>
                                                                )}
                                                                {event.title}
                                                                {(('isImportant' in event && event.isImportant)) && <span className="text-amber-500 text-sm">★</span>}
                                                            </h4>
                                                            {!isGoogle && (
                                                                <Edit2 className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                            )}
                                                        </div>

                                                        {event.description && (
                                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                                                                {event.description}
                                                            </p>
                                                        )}

                                                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                                                            {'category' in event && (
                                                                <span
                                                                    className="px-2 py-1 rounded-full"
                                                                    style={{ backgroundColor: `${eventColor}20`, color: eventColor }}
                                                                >
                                                                    {EVENT_CATEGORIES[event.category as keyof typeof EVENT_CATEGORIES]?.label || '기타'}
                                                                </span>
                                                            )}
                                                            {isGoogle && (
                                                                <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                                                    Google
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {event.isAllDay ? '하루 종일' : (
                                                                    <>
                                                                        {new Date(event.startTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                                                        {' - '}
                                                                        {new Date(event.endTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </>
                                                                )}
                                                            </span>
                                                        </div>

                                                        {/* Author / Owner */}
                                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                                            {(() => {
                                                                const person = isGoogle ? event.owner : (event as CalendarEvent).createdBy
                                                                return (
                                                                    <>
                                                                        {person.image ? (
                                                                            <img
                                                                                src={person.image}
                                                                                alt=""
                                                                                className="w-5 h-5 rounded-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                                                {person.name?.slice(0, 1) || '?'}
                                                                            </div>
                                                                        )}
                                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                            {person.name || '알 수 없음'}
                                                                        </span>
                                                                    </>
                                                                )
                                                            })()}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <CalendarIcon className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                                            <p className="text-sm text-slate-500 dark:text-slate-400">일정이 없습니다</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center py-12">
                                        <CalendarIcon className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                                        <p className="text-sm text-slate-500 dark:text-slate-400">달력에서 날짜를 선택해주세요</p>
                                    </div>
                                )}

                                {/* Upcoming */}
                                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">다가오는 일정</h3>
                                    {upcomingEvents.length > 0 ? (
                                        <div className="space-y-3">
                                            {upcomingEvents.map((event) => {
                                                const isGoogle = event.source === 'google'
                                                const eventColor = getEventColor(event)

                                                return (
                                                    <div
                                                        key={event.id}
                                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedDate(new Date(event.startTime))
                                                            if (isGoogle) {
                                                                setSelectedGoogleEvent(event as GoogleCalendarEvent)
                                                            } else if (event.source === 'db') {
                                                                openEditModal(event)
                                                            }
                                                        }}
                                                    >
                                                        <div
                                                            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white shadow-sm ${
                                                                isGoogle ? 'border-2 border-dashed border-white/30' : ''
                                                            }`}
                                                            style={{ backgroundColor: eventColor }}
                                                        >
                                                            <span className="text-[10px] font-medium opacity-80">
                                                                {new Date(event.startTime).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                                                            </span>
                                                            <span className="text-lg font-bold leading-none">
                                                                {new Date(event.startTime).getDate()}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                                                                {isGoogle && (
                                                                    <span className="text-[9px] px-1 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded font-bold flex-shrink-0">G</span>
                                                                )}
                                                                <span className="truncate">{event.title}</span>
                                                            </h4>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                                {event.isAllDay ? '하루 종일' : new Date(event.startTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                                                {isGoogle && event.owner && (
                                                                    <span className="ml-1.5 text-slate-400">· {event.owner.name}</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">예정된 일정이 없습니다</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Google Event Detail Modal */}
            <GoogleEventDetailModal
                isOpen={!!selectedGoogleEvent}
                onClose={() => setSelectedGoogleEvent(null)}
                event={selectedGoogleEvent}
                canEdit={!!(session?.user && (session.user.isAdmin || session.user.isApproved))}
            />

            {/* Event Form Modal */}
            <EventFormModal
                isOpen={isModalOpen}
                onClose={closeModal}
                selectedDate={selectedDate}
                event={selectedEvent ? {
                    ...selectedEvent,
                    startTime: new Date(selectedEvent.startTime),
                    endTime: new Date(selectedEvent.endTime),
                } : null}
                currentUserId={session?.user?.id}
                isAdmin={session?.user?.isAdmin}
            />
        </>
    )
}
