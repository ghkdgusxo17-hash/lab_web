'use client'

import Link from 'next/link'

const MATERIAL_TYPES = [
    { key: 'PAPER', label: '논문' },
    { key: 'PPT', label: 'PPT' },
    { key: 'DATA', label: '데이터' },
    { key: 'OTHER', label: '기타' },
]

interface MaterialTabsProps {
    currentCategory: string
    currentUserId?: string
    currentSearch?: string
    isLabMeetingActive?: boolean
}

export function MaterialTabs({ currentCategory, currentUserId, currentSearch, isLabMeetingActive }: MaterialTabsProps) {
    return (
        <div className="flex overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {MATERIAL_TYPES.map((t) => (
                <Link
                    key={t.key}
                    href={`/materials?category=${t.key}${currentUserId ? `&userId=${currentUserId}` : ''}${currentSearch ? `&search=${currentSearch}` : ''}`}
                    className={`px-6 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${!isLabMeetingActive && currentCategory === t.key
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    {t.label}
                </Link>
            ))}
            {/* Lab Meeting Tab (Separated) */}
            <Link
                href="/materials/lab-meeting"
                className={`ml-8 px-6 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${isLabMeetingActive
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                    }`}
            >
                Lab Meeting
            </Link>
        </div>
    )
}
