'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

export function LabMeetingSearch({ currentSearch }: { currentSearch: string }) {
    const [search, setSearch] = useState(currentSearch)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (search.trim()) {
            startTransition(() => {
                router.push(`/materials/lab-meeting?search=${encodeURIComponent(search.trim())}`)
            })
        }
    }

    const handleClear = () => {
        setSearch('')
        router.push('/materials/lab-meeting')
    }

    return (
        <form onSubmit={handleSearch} className="relative">
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="제목, 발표자, 설명 검색..."
                className="w-48 md:w-64 pl-9 pr-8 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            {(search || currentSearch) && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </form>
    )
}
