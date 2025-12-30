// Event category configuration
export const EVENT_CATEGORIES = {
    SEMINAR: { label: '세미나', color: '#3B82F6' },      // Blue
    MEETING: { label: '미팅', color: '#10B981' },        // Green
    DEADLINE: { label: '마감일', color: '#EF4444' },     // Red
    TRIP: { label: '출장', color: '#8B5CF6' },           // Purple
    VACATION: { label: '휴가', color: '#F59E0B' },       // Yellow
    OTHER: { label: '기타', color: '#6B7280' },          // Gray
} as const

export type EventCategory = keyof typeof EVENT_CATEGORIES
