'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

interface InventorySearchProps {
    currentSearch: string
    currentCategory: string
    currentFilter: string
}

export function InventorySearch({ currentSearch, currentCategory, currentFilter }: InventorySearchProps) {
    const [search, setSearch] = useState(currentSearch)
    const router = useRouter()

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        const params = new URLSearchParams()
        if (currentCategory) params.set('category', currentCategory)
        if (search) params.set('search', search)
        if (currentFilter) params.set('filter', currentFilter)
        router.push(`/inventory/items?${params.toString()}`)
    }

    function handleClear() {
        setSearch('')
        const params = new URLSearchParams()
        if (currentCategory) params.set('category', currentCategory)
        if (currentFilter) params.set('filter', currentFilter)
        router.push(`/inventory/items?${params.toString()}`)
    }

    return (
        <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="검색..."
                className="w-48 pl-9 pr-8 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {search && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </form>
    )
}
