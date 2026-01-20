'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react'
import { reorderSections } from '@/actions/inventory'

interface SectionOrderControlsProps {
    section: string
    index: number
    totalSections: number
    currentOrder: number
    allSections: { section: string; order: number }[]
}

export function SectionOrderControls({ section, index, totalSections, currentOrder, allSections }: SectionOrderControlsProps) {
    const [loading, setLoading] = useState(false)

    async function moveUp() {
        if (index === 0) return
        setLoading(true)

        // Swap orders with the section above
        const newSections = allSections.map((s, i) => {
            if (i === index - 1) return { ...s, order: currentOrder }
            if (i === index) return { ...s, order: allSections[index - 1].order }
            return s
        })

        await reorderSections(newSections)
        setLoading(false)
    }

    async function moveDown() {
        if (index === totalSections - 1) return
        setLoading(true)

        // Swap orders with the section below
        const newSections = allSections.map((s, i) => {
            if (i === index + 1) return { ...s, order: currentOrder }
            if (i === index) return { ...s, order: allSections[index + 1].order }
            return s
        })

        await reorderSections(newSections)
        setLoading(false)
    }

    return (
        <div className="flex items-center gap-1 mr-2">
            <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            <div className="flex flex-col">
                <button
                    onClick={moveUp}
                    disabled={loading || index === 0}
                    className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="위로 이동"
                >
                    <ChevronUp className="w-4 h-4" />
                </button>
                <button
                    onClick={moveDown}
                    disabled={loading || index === totalSections - 1}
                    className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="아래로 이동"
                >
                    <ChevronDown className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
