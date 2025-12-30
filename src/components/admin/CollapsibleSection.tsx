'use client'

import { useState, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface CollapsibleSectionProps {
    title: string
    icon: ReactNode
    iconColor: string
    borderColor: string
    count?: number
    countColor?: string
    defaultOpen?: boolean
    children: ReactNode
}

export function CollapsibleSection({
    title,
    icon,
    iconColor,
    borderColor,
    count,
    countColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    defaultOpen = false,
    children
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="mb-10 pb-6 border-b border-slate-200 dark:border-slate-800">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center gap-3 mb-4 pl-3 border-l-4 ${borderColor} text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 py-2 -my-2 rounded-r-lg transition-colors`}
            >
                <span className={iconColor}>{icon}</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex-1">
                    {title}
                </h2>
                {count !== undefined && (
                    <span className={`px-2.5 py-0.5 rounded-full text-sm font-bold ${countColor}`}>
                        {count}
                    </span>
                )}
                <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="animate-in fade-in duration-200">
                    {children}
                </div>
            )}
        </div>
    )
}
