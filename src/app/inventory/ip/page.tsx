import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout'
import { auth } from '@/auth'
import {
    getNetworkAssetOwnerOptions,
    getNetworkAssets,
    getNetworkAssetSummary,
} from '@/actions/network-asset'
import { NetworkAssetManager } from './NetworkAssetManager'
import { CheckCircle2, CircleDot, Network, ShieldCheck, UserRound } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'IP 관리 | CPE Lab',
    description: '연구실 네트워크 IP와 MAC 주소를 관리합니다.',
}

const FILTERS = [
    { value: '', label: '전체' },
    { value: 'IN_USE', label: '사용중' },
    { value: 'RESERVED', label: '예약' },
    { value: 'AVAILABLE', label: '사용 가능' },
    { value: 'RETIRED', label: '폐기' },
]

interface NetworkIpPageProps {
    searchParams: Promise<{ status?: string; search?: string; groupBy?: string }>
}

function filterHref(status: string, search: string, groupBy: string) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    if (groupBy && groupBy !== 'group') params.set('groupBy', groupBy)
    const query = params.toString()
    return `/inventory/ip${query ? `?${query}` : ''}`
}

function AccessPanel({ variant }: { variant: 'login' | 'pending' }) {
    return (
        <>
            <Navbar />
            <main className="min-h-screen px-6 pb-20 pt-32">
                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                        <Network className="h-7 w-7" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
                        {variant === 'login' ? '로그인이 필요합니다' : '승인된 멤버만 볼 수 있습니다'}
                    </h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        IP 관리는 연구실 내부 네트워크 정보라 승인된 멤버에게만 공개됩니다.
                    </p>
                    {variant === 'login' && (
                        <Link href="/login" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                            로그인
                        </Link>
                    )}
                </div>
            </main>
        </>
    )
}

export default async function NetworkIpPage({ searchParams }: NetworkIpPageProps) {
    const { status = '', search = '', groupBy = 'group' } = await searchParams
    const session = await auth()

    if (session?.user?.role === 'ALUMNI') {
        redirect('/board')
    }

    if (!session?.user) {
        return <AccessPanel variant="login" />
    }

    const isAdmin = Boolean(session.user.isAdmin)
    const canView = Boolean(session.user.isApproved || session.user.isAdmin)

    if (!canView) {
        return <AccessPanel variant="pending" />
    }

    const [assets, summary, owners] = await Promise.all([
        getNetworkAssets({ status, search }),
        getNetworkAssetSummary(),
        isAdmin ? getNetworkAssetOwnerOptions() : Promise.resolve([]),
    ])

    const serializedAssets = assets.map((asset) => ({
        ...asset,
        createdAt: asset.createdAt.toISOString(),
        updatedAt: asset.updatedAt.toISOString(),
    }))

    return (
        <>
            <Navbar />
            <main className="min-h-screen px-6 pb-20 pt-32">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <Link href="/inventory" className="transition hover:text-blue-600">자원관리</Link>
                                <span>/</span>
                                <span>IP 관리</span>
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white md:text-5xl">
                                IP 관리
                            </h1>
                            <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
                                연구실 네트워크의 IPv4, MAC 주소, 담당자와 장비 정보를 한곳에서 관리합니다.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
                            조회: 승인 멤버 전체 · 편집: 관리자
                        </div>
                    </div>

                    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-3 flex items-center gap-3">
                                <div className="rounded-xl bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                                    <Network className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">등록 IP</span>
                            </div>
                            <p className="text-3xl font-bold text-slate-950 dark:text-white">{summary.total}</p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-3 flex items-center gap-3">
                                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                                    <CircleDot className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">사용중</span>
                            </div>
                            <p className="text-3xl font-bold text-slate-950 dark:text-white">{summary.inUse}</p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-3 flex items-center gap-3">
                                <div className="rounded-xl bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">사용 가능</span>
                            </div>
                            <p className="text-3xl font-bold text-slate-950 dark:text-white">{summary.available}</p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-3 flex items-center gap-3">
                                <div className="rounded-xl bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                                    <UserRound className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">담당 미지정</span>
                            </div>
                            <p className="text-3xl font-bold text-slate-950 dark:text-white">{summary.unassigned}</p>
                        </div>
                    </div>

                    <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex overflow-x-auto">
                            {FILTERS.map((filter) => {
                                const active = status === filter.value
                                return (
                                    <Link
                                        key={filter.value || 'ALL'}
                                        href={filterHref(filter.value, search, groupBy)}
                                        className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${active
                                            ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                                            }`}
                                    >
                                        {filter.label}
                                    </Link>
                                )
                            })}
                        </div>
                        <div className="flex items-center gap-2 px-2 text-sm text-slate-500 dark:text-slate-400">
                            <ShieldCheck className="h-4 w-4 text-blue-500" />
                            <span>현재 {serializedAssets.length}개 표시</span>
                        </div>
                    </div>

                    <NetworkAssetManager
                        assets={serializedAssets}
                        owners={owners}
                        isAdmin={isAdmin}
                        currentSearch={search}
                        currentStatus={status}
                        currentGroupBy={groupBy}
                    />
                </div>
            </main>
        </>
    )
}
