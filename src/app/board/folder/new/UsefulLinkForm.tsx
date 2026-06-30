'use client'

import { FormEvent, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { createUsefulLink, UsefulLinkItem } from '@/actions/useful-link'

const LOCAL_STORAGE_KEY = 'cpe-lab-useful-links'

interface UsefulLinkFormProps {
    currentUserId: string
    currentUserName: string | null
    isLocalPreview?: boolean
}

function normalizeCategoryLabel(value: string) {
    const normalized = value.trim().replace(/\s+/g, ' ').toUpperCase()
    const aliases: Record<string, string> = {
        GENERAL: 'GENERAL',
        REFERENCE: 'REFERENCE',
        REFERANCE: 'REFERENCE',
        RESEARCH: 'REFERENCE',
        LITERATURE: 'REFERENCE',
        TOOL: 'TOOL',
        TOOLS: 'TOOL',
        CODE: 'TOOL',
    }

    return aliases[normalized] || normalized || 'GENERAL'
}

function normalizeUrl(value: string) {
    const trimmed = value.trim()
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    return new URL(withProtocol).toString()
}

function titleFromUrl(url: string) {
    const { hostname } = new URL(url)
    return hostname.replace(/^www\./, '')
}

function saveLocalLink(link: UsefulLinkItem) {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    let links: UsefulLinkItem[] = []

    if (stored) {
        try {
            links = JSON.parse(stored) as UsefulLinkItem[]
        } catch {
            links = []
        }
    }

    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([link, ...links]))
}

export function UsefulLinkForm({ currentUserId, currentUserName, isLocalPreview }: UsefulLinkFormProps) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [categoryValue, setCategoryValue] = useState('GENERAL')
    const [isPending, startTransition] = useTransition()

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError(null)

        const formData = new FormData(event.currentTarget)
        formData.set('category', normalizeCategoryLabel(categoryValue))

        if (isLocalPreview) {
            const rawUrl = String(formData.get('url') ?? '').trim()
            const title = String(formData.get('title') ?? '').trim()
            const description = String(formData.get('description') ?? '').trim()
            const category = normalizeCategoryLabel(String(formData.get('category') ?? 'GENERAL'))
            const authorName = currentUserName || 'Local Preview'

            if (!rawUrl) {
                setError('사이트 주소를 입력해주세요.')
                return
            }

            let url: string
            try {
                url = normalizeUrl(rawUrl)
            } catch {
                setError('올바른 사이트 주소를 입력해주세요.')
                return
            }

            const localLink = {
                id: `local-${Date.now()}`,
                title: title || titleFromUrl(url),
                url,
                description: description || null,
                category,
                authorId: currentUserId,
                authorName,
                createdAt: new Date().toISOString(),
            }

            saveLocalLink(localLink)
            router.push('/board/folder')
            router.refresh()
            return
        }

        startTransition(async () => {
            const result = await createUsefulLink(formData)

            if ('error' in result && result.error) {
                setError(result.error)
                return
            }

            if ('link' in result && result.link && 'localOnly' in result && result.localOnly) {
                saveLocalLink(result.link)
            }

            router.push('/board/folder')
            router.refresh()
        })
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 t-rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 md:p-6">
            <div className="grid gap-4">
                <Input
                    id="url"
                    name="url"
                    label="사이트 주소"
                    placeholder="https://scholar.google.com"
                    required
                />
                <div className="grid md:grid-cols-[1fr_220px] gap-4">
                    <Input
                        id="title"
                        name="title"
                        label="사이트명"
                        placeholder="비워두면 주소로 자동 표시"
                    />
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            카테고리
                        </label>
                        <div className="relative">
                            <select
                                id="category"
                                name="category"
                                value={categoryValue}
                                onChange={(event) => setCategoryValue(event.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
                            >
                                <option value="GENERAL">GENERAL</option>
                                <option value="REFERENCE">REFERENCE</option>
                                <option value="TOOL">TOOL</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
                <Textarea
                    id="description"
                    name="description"
                    label="짧은 설명"
                    placeholder="다 같이 보면 좋은 이유나 사용 팁을 적어주세요."
                    rows={4}
                />
            </div>

            <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="min-h-5 text-sm text-red-500">
                    {error}
                </div>
                <div className="flex justify-end gap-2">
                    <Link
                        href="/board/folder"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        취소
                    </Link>
                    <Button type="submit" isLoading={isPending} className="gap-2">
                        <Upload className="w-4 h-4" />
                        업로드
                    </Button>
                </div>
            </div>
        </form>
    )
}
