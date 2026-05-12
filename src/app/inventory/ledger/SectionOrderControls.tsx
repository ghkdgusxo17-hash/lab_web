'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function moveUp() {
        if (index === 0) return
        setLoading(true)

        // Assign new order values based on index position
        const newSections = allSections.map((s, i) => {
            if (i === index - 1) return { ...s, order: index }
            if (i === index) return { ...s, order: index - 1 }
            return { ...s, order: i }
        })

        await reorderSections(newSections)
        router.refresh()
        setLoading(false)
    }

    async function moveDown() {
        if (index === totalSections - 1) return
        setLoading(true)

        // Assign new order values based on index position
        const newSections = allSections.map((s, i) => {
            if (i === index + 1) return { ...s, order: index }
            if (i === index) return { ...s, order: index + 1 }
            return { ...s, order: i }
        })

        await reorderSections(newSections)
        router.refresh()
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
