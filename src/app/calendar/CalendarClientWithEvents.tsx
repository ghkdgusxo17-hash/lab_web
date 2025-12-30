'use client'

import { useState } from 'react'
import { Session } from 'next-auth'
import { NavbarClient } from '@/components/layout/NavbarClient'
import { EventFormModal } from './EventFormModal'
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar as CalendarIcon, Edit2 } from 'lucide-react'
import { EVENT_CATEGORIES } from '@/lib/event-categories'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

interface CalendarEvent {
    id: string
    title: string
    description: string | null
    category: string
    startTime: string
    endTime: string
    isAllDay: boolean
    color: string | null
    createdById: string
    createdBy: {
        id: string
        name: string | null
        image: string | null
    }
}

interface CalendarClientWithEventsProps {
    session: Session | null
    events: CalendarEvent[]
}

export function CalendarClientWithEvents({ session, events }: CalendarClientWithEventsProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

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

    const getEventsForDate = (date: Date) => {
        return events.filter((event) => {
            const eventDate = new Date(event.startTime)
            return (
                eventDate.getFullYear() === date.getFullYear() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getDate() === date.getDate()
            )
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

    const upcomingEvents = events
        .filter((e) => new Date(e.startTime) >= new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 3)

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
                        <p className="text-lg text-slate-600 dark:text-slate-300">
                            연구실의 주요 일정과 이벤트를 확인하세요
                        </p>
                    </div>

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

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => setSelectedDate(date)}
                                            className={`relative min-h-[80px] p-1.5 rounded-xl transition-all duration-200 group flex flex-col ${isSelected(day)
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02] z-10'
                                                : isToday(day)
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500 ring-inset'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            <span
                                                className={`text-sm font-bold mb-1 ${!isSelected(day) && dayOfWeek === 0 ? 'text-red-500' :
                                                    !isSelected(day) && dayOfWeek === 6 ? 'text-blue-500' : ''
                                                    }`}
                                            >
                                                {day}
                                            </span>
                                            {dayEvents.length > 0 && (
                                                <div className="flex-1 flex flex-col gap-0.5 w-full overflow-hidden">
                                                    {dayEvents.slice(0, 2).map((event) => (
                                                        <div
                                                            key={event.id}
                                                            className={`w-full px-1 py-0.5 rounded text-[10px] font-medium truncate ${isSelected(day) ? 'bg-white/30 text-white' : 'text-white'}`}
                                                            style={{ backgroundColor: isSelected(day) ? undefined : event.color || '#6B7280' }}
                                                        >
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
                                            {selectedDateEvents.map((event) => (
                                                <div
                                                    key={event.id}
                                                    className="group p-4 rounded-2xl border-l-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all cursor-pointer"
                                                    style={{ borderLeftColor: event.color || '#6B7280' }}
                                                    onClick={() => openEditModal(event)}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="font-bold text-slate-900 dark:text-white">{event.title}</h4>
                                                        <Edit2 className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                    </div>

                                                    {event.description && (
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                                                            {event.description}
                                                        </p>
                                                    )}

                                                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                                                        <span
                                                            className="px-2 py-1 rounded-full"
                                                            style={{ backgroundColor: `${event.color}20`, color: event.color || '#6B7280' }}
                                                        >
                                                            {EVENT_CATEGORIES[event.category as keyof typeof EVENT_CATEGORIES]?.label || '기타'}
                                                        </span>
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

                                                    {/* Author */}
                                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                                        {event.createdBy.image ? (
                                                            <img
                                                                src={event.createdBy.image}
                                                                alt=""
                                                                className="w-5 h-5 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                                {event.createdBy.name?.slice(0, 1) || '?'}
                                                            </div>
                                                        )}
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            {event.createdBy.name || '알 수 없음'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
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
                                            {upcomingEvents.map((event) => (
                                                <div
                                                    key={event.id}
                                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedDate(new Date(event.startTime))
                                                        openEditModal(event)
                                                    }}
                                                >
                                                    <div
                                                        className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white shadow-sm"
                                                        style={{ backgroundColor: event.color || '#6B7280' }}
                                                    >
                                                        <span className="text-[10px] font-medium opacity-80">
                                                            {new Date(event.startTime).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                                                        </span>
                                                        <span className="text-lg font-bold leading-none">
                                                            {new Date(event.startTime).getDate()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{event.title}</h4>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                            {event.isAllDay ? '하루 종일' : new Date(event.startTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
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
