'use client'

interface Reservation {
    id: string
    startTime: string
    endTime: string
    purpose: string | null
    user: {
        id: string
        name: string | null
        image: string | null
    }
}

interface WeeklyCalendarProps {
    weekStart: Date
    reservations: Reservation[]
    currentUserId?: string
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 9) // 9:00 - 20:00
const DAYS = ['월', '화', '수', '목', '금', '토', '일']

export function WeeklyCalendar({ weekStart, reservations, currentUserId }: WeeklyCalendarProps) {
    // Generate dates for the week
    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart)
        date.setDate(date.getDate() + i)
        return date
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    function getReservationForSlot(dayIndex: number, hour: number): Reservation | null {
        const slotDate = weekDates[dayIndex]
        const slotStart = new Date(slotDate)
        slotStart.setHours(hour, 0, 0, 0)

        return reservations.find(r => {
            const start = new Date(r.startTime)
            const end = new Date(r.endTime)
            return slotStart >= start && slotStart < end
        }) || null
    }

    function isSlotStart(dayIndex: number, hour: number, reservation: Reservation): boolean {
        const slotDate = weekDates[dayIndex]
        const slotStart = new Date(slotDate)
        slotStart.setHours(hour, 0, 0, 0)
        const resStart = new Date(reservation.startTime)
        return slotStart.getTime() === resStart.getTime()
    }

    function getSlotHeight(reservation: Reservation): number {
        const start = new Date(reservation.startTime)
        const end = new Date(reservation.endTime)
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        return hours
    }

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[600px]">
                {/* Header */}
                <div className="grid grid-cols-8 gap-1 mb-2">
                    <div className="text-xs text-slate-400 font-medium p-2"></div>
                    {weekDates.map((date, i) => {
                        const isToday = date.getTime() === today.getTime()
                        return (
                            <div
                                key={i}
                                className={`text-center p-2 rounded-lg ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                    }`}
                            >
                                <div className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                                    {DAYS[i]}
                                </div>
                                <div className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {date.getDate()}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Time slots */}
                <div className="space-y-0.5">
                    {HOURS.map((hour) => (
                        <div key={hour} className="grid grid-cols-8 gap-1">
                            <div className="text-xs text-slate-400 font-medium p-2 text-right">
                                {hour}:00
                            </div>
                            {weekDates.map((date, dayIndex) => {
                                const isPast = date < today || (date.getTime() === today.getTime() && hour < new Date().getHours())
                                const reservation = getReservationForSlot(dayIndex, hour)
                                const isStart = reservation && isSlotStart(dayIndex, hour, reservation)
                                const isMine = reservation?.user.id === currentUserId

                                if (reservation && !isStart) {
                                    // Part of a multi-hour reservation, skip rendering
                                    return <div key={dayIndex} className="h-10" />
                                }

                                if (reservation && isStart) {
                                    const height = getSlotHeight(reservation)
                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`rounded-lg p-1.5 text-xs relative ${isMine
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                                                    : 'bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800'
                                                }`}
                                            style={{ height: `${height * 2.5 + (height - 1) * 0.25}rem` }}
                                        >
                                            <div className={`font-bold truncate ${isMine ? 'text-blue-700' : 'text-orange-700'}`}>
                                                {reservation.user.name}
                                            </div>
                                            {reservation.purpose && (
                                                <div className="text-slate-500 truncate text-[10px]">
                                                    {reservation.purpose}
                                                </div>
                                            )}
                                        </div>
                                    )
                                }

                                return (
                                    <div
                                        key={dayIndex}
                                        className={`h-10 rounded-lg border border-dashed ${isPast
                                                ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300 transition-colors'
                                            }`}
                                    />
                                )
                            })}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
                        <span>내 예약</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-orange-100 border border-orange-200" />
                        <span>다른 사람 예약</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
