'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { ExternalLink, Link as LinkIcon, Search, Trash2 } from 'lucide-react'
import { deleteUsefulLink, UsefulLinkItem } from '@/actions/useful-link'

const LOCAL_STORAGE_KEY = 'cpe-lab-useful-links'

const FIXED_CATEGORIES = ['REFERENCE', 'TOOL', 'GENERAL']

interface UsefulLinksClientProps {
    initialLinks: UsefulLinkItem[]
    currentUserId?: string
    isAdmin?: boolean
    isLocalPreview?: boolean
}

function getCategoryLabel(value: string) {
    const aliases: Record<string, string> = {
        GENERAL: 'GENERAL',
        REFERENCE: 'REFERENCE',
        REFERANCE: 'REFERENCE',
        RESEARCH: 'REFERENCE',
        LITERATURE: 'REFERENCE',
        PREPRINT: 'REFERENCE',
        WRITING: 'REFERENCE',
        JOURNAL: 'REFERENCE',
        TOOL: 'TOOL',
        TOOLS: 'TOOL',
        CODE: 'TOOL',
    }

    return aliases[value.toUpperCase()] || value
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).replace(/\. /g, '.').replace(/\.$/, '')
}

function mergeLinks(serverLinks: UsefulLinkItem[], localLinks: UsefulLinkItem[]) {
    const seen = new Set<string>()
    return [...localLinks, ...serverLinks].filter((link) => {
        if (seen.has(link.id)) {
            return false
        }
        seen.add(link.id)
        return true
    })
}

export function UsefulLinksClient({
    initialLinks,
    currentUserId,
    isAdmin,
    isLocalPreview,
}: UsefulLinksClientProps) {
    const searchParams = useSearchParams()
    const [links, setLinks] = useState<UsefulLinkItem[]>(initialLinks)
    const [query, setQuery] = useState('')
    const [category, setCategory] = useState('')
    const [expandedId, setExpandedId] = useState<string | null>(searchParams.get('open'))
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (!isLocalPreview) {
            return
        }

        const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY)
        if (!stored) {
            return
        }

        try {
            const localLinks = JSON.parse(stored) as UsefulLinkItem[]
            setLinks(mergeLinks(initialLinks, localLinks))
        } catch {
            window.localStorage.removeItem(LOCAL_STORAGE_KEY)
        }
    }, [initialLinks, isLocalPreview])

    useEffect(() => {
        setExpandedId(searchParams.get('open'))
    }, [searchParams])

    const categoryOptions = useMemo(() => {
        const labels = new Map<string, string>()

        FIXED_CATEGORIES.forEach((item) => labels.set(item.toLowerCase(), item))
        links.forEach((link) => {
            const label = getCategoryLabel(link.category).trim()
            if (label) {
                labels.set(label.toLowerCase(), label)
            }
        })

        return Array.from(labels.values())
    }, [links])

    const filteredLinks = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()
        const normalizedCategory = category.trim().toLowerCase()

        return links.filter((link) => {
            const matchesCategory = !normalizedCategory ||
                getCategoryLabel(link.category).toLowerCase() === normalizedCategory
            const matchesQuery = !normalizedQuery ||
                link.title.toLowerCase().includes(normalizedQuery) ||
                link.url.toLowerCase().includes(normalizedQuery) ||
                (link.description || '').toLowerCase().includes(normalizedQuery) ||
                (link.authorName || '').toLowerCase().includes(normalizedQuery)

            return matchesCategory && matchesQuery
        })
    }, [category, links, query])

    const saveLocalLinks = (nextLinks: UsefulLinkItem[]) => {
        if (isLocalPreview) {
            window.localStorage.setItem(
                LOCAL_STORAGE_KEY,
                JSON.stringify(nextLinks.filter((link) => link.id.startsWith('local-')))
            )
        }
    }

    const handleDelete = (id: string) => {
        startTransition(async () => {
            const result = await deleteUsefulLink(id)

            if ('error' in result && result.error) {
                return
            }

            const nextLinks = links.filter((link) => link.id !== id)
            setLinks(nextLinks)
            saveLocalLinks(nextLinks)
            if (expandedId === id) {
                setExpandedId(null)
            }
        })
    }

    return (
        <div className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between pb-5">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="사이트 검색"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="flex w-full md:min-w-0 md:flex-1 items-center gap-2 overflow-hidden">
                    <input
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        placeholder="카테고리 입력"
                        className="shrink-0 w-36 md:w-44 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="flex min-w-0 flex-1 md:justify-end gap-2 overflow-x-auto pb-1 md:pb-0">
                    {[{ value: '', label: 'ALL' }, ...categoryOptions.map((item) => ({ value: item, label: item }))].map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => setCategory(item.value)}
                            className={`shrink-0 h-9 px-3 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap ${category === item.value
                                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                    </div>
                </div>
            </div>

            {filteredLinks.length === 0 ? (
                <div className="py-16 text-center">
                    <LinkIcon className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                    <p className="font-medium text-slate-700 dark:text-slate-300">등록된 사이트가 없습니다.</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">연구실 사람들이 함께 보면 좋은 사이트를 추가해보세요.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    {filteredLinks.map((link) => {
                        const canDelete = isAdmin || link.authorId === currentUserId || link.id.startsWith('local-')
                        const isExpanded = expandedId === link.id

                        return (
                            <article
                                key={link.id}
                                className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="grid gap-2 md:grid-cols-[110px_minmax(140px,1fr)_minmax(180px,1.4fr)_120px_90px_auto] md:items-center px-4 py-3">
                                    <span className="shrink-0 inline-flex items-center justify-center h-6 px-2 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        {getCategoryLabel(link.category)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setExpandedId(isExpanded ? null : link.id)}
                                        className="min-w-0 text-left"
                                    >
                                        <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                            {link.title}
                                        </h2>
                                    </button>
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        <span className="truncate">{link.url}</span>
                                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                    </a>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        {link.authorName || 'Unknown'}
                                    </span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">
                                        {formatDate(link.createdAt)}
                                    </span>
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedId(isExpanded ? null : link.id)}
                                            className="px-2 py-1 text-xs font-medium rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            {isExpanded ? '접기' : '보기'}
                                        </button>
                                        {canDelete && (
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(link.id)}
                                                disabled={isPending}
                                                className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                                aria-label="링크 삭제"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="px-4 pb-4 md:pl-[134px]">
                                        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                                            {link.description || '등록된 설명이 없습니다.'}
                                        </p>
                                    </div>
                                )}
                            </article>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
