'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

interface MaterialSearchProps {
    currentSearch: string
    currentCategory: string
    currentUserId: string
}

export function MaterialSearch({ currentSearch, currentCategory, currentUserId }: MaterialSearchProps) {
    const [search, setSearch] = useState(currentSearch)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams()
        if (currentCategory) params.set('category', currentCategory)
        if (currentUserId) params.set('userId', currentUserId)
        if (search.trim()) params.set('search', search.trim())
        startTransition(() => {
            router.push(`/materials?${params.toString()}`)
        })
    }

    const handleClear = () => {
        setSearch('')
        const params = new URLSearchParams()
        if (currentCategory) params.set('category', currentCategory)
        if (currentUserId) params.set('userId', currentUserId)
        router.push(`/materials?${params.toString()}`)
    }

    return (
        <form onSubmit={handleSearch} className="relative">
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="검색..."
                className="w-40 md:w-48 pl-9 pr-8 py-1.5 text-sm border border-slate-200 dark:border-slate-700 t-rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
