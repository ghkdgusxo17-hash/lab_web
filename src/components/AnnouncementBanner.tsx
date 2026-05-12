'use client'

import { useEffect, useState } from 'react'
import { X, Megaphone } from 'lucide-react'

interface Announcement {
    id: string
    title: string
    content: string
    priority: number
}

interface AnnouncementBannerProps {
    announcements: Announcement[]
}

export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
    const [dismissedIds, setDismissedIds] = useState<string[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Load dismissed announcements from localStorage
        const stored = localStorage.getItem('dismissedAnnouncements')
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                setDismissedIds(parsed)
            } catch {
                // ignore
            }
        }
    }, [])

    const handleDismiss = (id: string) => {
        const newDismissed = [...dismissedIds, id]
        setDismissedIds(newDismissed)
        localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed))
    }

    if (!mounted) return null

    const visibleAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id))

    if (visibleAnnouncements.length === 0) return null

    return (
        <div className="fixed top-20 left-0 right-0 z-40 px-4">
            <div className="max-w-4xl mx-auto space-y-2">
                {visibleAnnouncements.map((announcement) => (
                    <div
                        key={announcement.id}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 animate-in slide-in-from-top-5 duration-300"
                    >
                        <Megaphone className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm">{announcement.title}</h4>
                            <p className="text-sm text-white/90 mt-0.5 line-clamp-2">{announcement.content}</p>
                        </div>
                        <button
                            onClick={() => handleDismiss(announcement.id)}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                            aria-label="닫기"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
