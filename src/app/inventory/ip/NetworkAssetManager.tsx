'use client'

import { FormEvent, Fragment, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    CheckCircle2,
    CircleDot,
    Edit3,
    FileText,
    Loader2,
    MapPin,
    Monitor,
    Network,
    Plus,
    Router,
    Search,
    ShieldCheck,
    Trash2,
    UserRound,
    Wifi,
    X,
} from 'lucide-react'
import {
    createNetworkAsset,
    deleteNetworkAsset,
    importNetworkAssetsFromIpconfigText,
    updateNetworkAsset,
} from '@/actions/network-asset'

type OwnerOption = {
    id: string
    name: string | null
    email: string | null
    image: string | null
}

type NetworkAssetView = {
    id: string
    ownerId: string | null
    ownerName: string | null
    owner: OwnerOption | null
    deviceName: string | null
    adapterName: string | null
    ipv4Address: string
    ipv6Address: string | null
    macAddress: string | null
    subnetMask: string | null
    gateway: string | null
    dnsServer: string | null
    dhcpEnabled: boolean | null
    location: string | null
    groupName: string
    displayOrder: number
    status: string
    notes: string | null
    updatedAt: string
}

type FormState = {
    ownerId: string
    ownerName: string
    deviceName: string
    adapterName: string
    ipv4Address: string
    ipv6Address: string
    macAddress: string
    subnetMask: string
    gateway: string
    dnsServer: string
    dhcpEnabled: string
    location: string
    groupName: string
    displayOrder: string
    status: string
    notes: string
}

interface NetworkAssetManagerProps {
    assets: NetworkAssetView[]
    owners: OwnerOption[]
    isAdmin: boolean
    currentSearch: string
    currentStatus: string
    currentGroupBy: string
}

const STATUS_OPTIONS = [
    {
        value: 'IN_USE',
        label: '사용중',
        icon: CircleDot,
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        dot: 'bg-emerald-500',
    },
    {
        value: 'RESERVED',
        label: '예약',
        icon: ShieldCheck,
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        dot: 'bg-amber-500',
    },
    {
        value: 'AVAILABLE',
        label: '사용 가능',
        icon: CheckCircle2,
        badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
        dot: 'bg-sky-500',
    },
    {
        value: 'RETIRED',
        label: '폐기',
        icon: X,
        badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        dot: 'bg-slate-400',
    },
]

const EMPTY_FORM: FormState = {
    ownerId: '',
    ownerName: '',
    deviceName: '',
    adapterName: '',
    ipv4Address: '',
    ipv6Address: '',
    macAddress: '',
    subnetMask: '255.255.255.0',
    gateway: '10.40.230.254',
    dnsServer: '',
    dhcpEnabled: '',
    location: '',
    groupName: '일반',
    displayOrder: '0',
    status: 'IN_USE',
    notes: '',
}

const GROUP_SUGGESTIONS = ['일반', '서버', '개인 PC', '공용 장비', '사용 가능', '예약', '기타']

const GROUP_BY_OPTIONS = [
    { value: 'group', label: '그룹별' },
    { value: 'status', label: '상태별' },
    { value: 'none', label: '목록' },
]

function getStatusInfo(status: string) {
    return STATUS_OPTIONS.find((option) => option.value === status) ?? STATUS_OPTIONS[0]
}

function ownerLabel(asset: NetworkAssetView) {
    return asset.owner?.name || asset.ownerName || '미지정'
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value))
}

function formFromAsset(asset: NetworkAssetView): FormState {
    return {
        ownerId: asset.ownerId ?? '',
        ownerName: asset.ownerName ?? asset.owner?.name ?? '',
        deviceName: asset.deviceName ?? '',
        adapterName: asset.adapterName ?? '',
        ipv4Address: asset.ipv4Address,
        ipv6Address: asset.ipv6Address ?? '',
        macAddress: asset.macAddress ?? '',
        subnetMask: asset.subnetMask ?? '',
        gateway: asset.gateway ?? '',
        dnsServer: asset.dnsServer ?? '',
        dhcpEnabled: asset.dhcpEnabled === null ? '' : String(asset.dhcpEnabled),
        location: asset.location ?? '',
        groupName: asset.groupName ?? '일반',
        displayOrder: String(asset.displayOrder ?? 0),
        status: asset.status,
        notes: asset.notes ?? '',
    }
}

export function NetworkAssetManager({
    assets,
    owners,
    isAdmin,
    currentSearch,
    currentStatus,
    currentGroupBy,
}: NetworkAssetManagerProps) {
    const router = useRouter()
    const [search, setSearch] = useState(currentSearch)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [editingAsset, setEditingAsset] = useState<NetworkAssetView | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [importError, setImportError] = useState<string | null>(null)
    const [importMessage, setImportMessage] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const groupBy = GROUP_BY_OPTIONS.some((option) => option.value === currentGroupBy) ? currentGroupBy : 'group'
    const ownerMap = useMemo(() => new Map(owners.map((owner) => [owner.id, owner])), [owners])
    const groupedAssets = useMemo(() => {
        if (groupBy === 'none') {
            return [{ key: 'all', label: '전체', assets }]
        }

        const groupMap = new Map<string, NetworkAssetView[]>()
        for (const asset of assets) {
            const key = groupBy === 'status'
                ? getStatusInfo(asset.status).label
                : asset.groupName || '일반'
            groupMap.set(key, [...(groupMap.get(key) ?? []), asset])
        }

        return Array.from(groupMap.entries())
            .sort(([a], [b]) => a.localeCompare(b, 'ko-KR'))
            .map(([key, groupAssets]) => ({ key, label: key, assets: groupAssets }))
    }, [assets, groupBy])

    function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((current) => ({ ...current, [key]: value }))
    }

    function openCreateModal() {
        setForm(EMPTY_FORM)
        setEditingAsset(null)
        setFormError(null)
        setIsModalOpen(true)
    }

    function openEditModal(asset: NetworkAssetView) {
        setForm(formFromAsset(asset))
        setEditingAsset(asset)
        setFormError(null)
        setIsModalOpen(true)
    }

    function closeModal() {
        if (isPending) return
        setIsModalOpen(false)
        setEditingAsset(null)
        setFormError(null)
    }

    function openImportModal() {
        setImportError(null)
        setImportMessage(null)
        setIsImportModalOpen(true)
    }

    function closeImportModal() {
        if (isPending) return
        setIsImportModalOpen(false)
        setImportError(null)
        setImportMessage(null)
    }

    function handleOwnerChange(ownerId: string) {
        const owner = ownerMap.get(ownerId)
        setForm((current) => ({
            ...current,
            ownerId,
            ownerName: owner?.name ?? current.ownerName,
        }))
    }

    function applySearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const params = new URLSearchParams()
        if (currentStatus) params.set('status', currentStatus)
        if (groupBy !== 'group') params.set('groupBy', groupBy)
        if (search.trim()) params.set('search', search.trim())
        router.push(`/inventory/ip${params.toString() ? `?${params.toString()}` : ''}`)
    }

    function clearSearch() {
        setSearch('')
        const params = new URLSearchParams()
        if (currentStatus) params.set('status', currentStatus)
        if (groupBy !== 'group') params.set('groupBy', groupBy)
        router.push(`/inventory/ip${params.toString() ? `?${params.toString()}` : ''}`)
    }

    function groupByHref(nextGroupBy: string) {
        const params = new URLSearchParams()
        if (currentStatus) params.set('status', currentStatus)
        if (search.trim()) params.set('search', search.trim())
        if (nextGroupBy !== 'group') params.set('groupBy', nextGroupBy)
        return `/inventory/ip${params.toString() ? `?${params.toString()}` : ''}`
    }

    function submitForm(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)

        startTransition(async () => {
            setFormError(null)
            const result = editingAsset
                ? await updateNetworkAsset(editingAsset.id, formData)
                : await createNetworkAsset(formData)

            if ('error' in result && result.error) {
                setFormError(result.error)
                return
            }

            setIsModalOpen(false)
            setEditingAsset(null)
            router.refresh()
        })
    }

    function handleDelete(asset: NetworkAssetView) {
        if (!window.confirm(`${asset.ipv4Address} 항목을 삭제할까요?`)) return

        startTransition(async () => {
            const result = await deleteNetworkAsset(asset.id)
            if ('error' in result && result.error) {
                setFormError(result.error)
                return
            }
            router.refresh()
        })
    }

    function submitImport(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)

        startTransition(async () => {
            setImportError(null)
            setImportMessage(null)

            const result = await importNetworkAssetsFromIpconfigText(formData)
            if (!('success' in result)) {
                setImportError('error' in result && result.error ? result.error : 'ipconfig 텍스트를 처리하지 못했습니다.')
                return
            }

            setImportMessage(
                `완료: ${result.created}개 추가, ${result.updated}개 갱신, ${result.skipped}개 건너뜀`
            )
            router.refresh()
        })
    }

    return (
        <div className="space-y-4">
            <datalist id="network-asset-group-suggestions">
                {GROUP_SUGGESTIONS.map((group) => (
                    <option key={group} value={group} />
                ))}
            </datalist>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <form onSubmit={applySearch} className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="IP, MAC, 사용자, 장비 검색"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute right-2 top-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            aria-label="검색 초기화"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </form>

                {isAdmin && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={openImportModal}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-300"
                        >
                            <FileText className="h-4 w-4" />
                            텍스트 붙여넣기
                        </button>
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            IP 추가
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <Network className="h-4 w-4 text-blue-500" />
                    보기 방식
                </div>
                <div className="flex flex-wrap gap-2">
                    {GROUP_BY_OPTIONS.map((option) => (
                        <Link
                            key={option.value}
                            href={groupByHref(option.value)}
                            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${groupBy === option.value
                                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white'
                                }`}
                        >
                            {option.label}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                            <Network className="h-7 w-7" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">등록된 IP가 없습니다</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {isAdmin ? '관리자가 첫 IP 항목을 등록할 수 있습니다.' : '관리자에게 등록을 요청해 주세요.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto lg:overflow-visible">
                        <table className="w-full min-w-[780px] table-fixed divide-y divide-slate-200 dark:divide-slate-800 lg:min-w-0">
                            <thead className="bg-slate-50 dark:bg-slate-800/60">
                                <tr>
                                    <th className="w-[118px] px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">상태</th>
                                    <th className="w-[170px] px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">주소</th>
                                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">사용자 / 장비</th>
                                    <th className="w-[150px] px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">네트워크</th>
                                    <th className="w-[150px] px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">위치</th>
                                    {isAdmin && <th className="w-[104px] px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">관리</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {groupedAssets.map((group) => (
                                    <Fragment key={group.key}>
                                        {groupBy !== 'none' && (
                                            <tr className="bg-slate-100/80 dark:bg-slate-800/80">
                                                <td colSpan={isAdmin ? 6 : 5} className="px-3 py-2">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                            {group.label}
                                                        </span>
                                                        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                                            {group.assets.length}개
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {group.assets.map((asset) => {
                                    const statusInfo = getStatusInfo(asset.status)
                                    const StatusIcon = statusInfo.icon

                                    return (
                                        <tr key={asset.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                                            <td className="px-3 py-3 align-top">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusInfo.badge}`}>
                                                    <StatusIcon className="h-3.5 w-3.5" />
                                                    {statusInfo.label}
                                                </span>
                                                <div className="mt-2 text-xs text-slate-400">
                                                    {asset.groupName || '일반'} · #{asset.displayOrder}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <div className="truncate font-mono text-sm font-bold text-slate-950 dark:text-white">
                                                    {asset.ipv4Address}
                                                </div>
                                                {asset.macAddress && (
                                                    <div className="mt-1 truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                                                        {asset.macAddress}
                                                    </div>
                                                )}
                                                {asset.ipv6Address && (
                                                    <div className="mt-1 truncate font-mono text-xs text-slate-400">
                                                        {asset.ipv6Address}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <div className="flex min-w-0 items-start gap-2">
                                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                                        <UserRound className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="truncate font-semibold text-slate-900 dark:text-white">
                                                            {ownerLabel(asset)}
                                                        </div>
                                                        {asset.deviceName && (
                                                            <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                                                                <Monitor className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate">{asset.deviceName}</span>
                                                            </div>
                                                        )}
                                                        {asset.adapterName && (
                                                            <div className="mt-1 truncate text-xs text-slate-400">
                                                                {asset.adapterName}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 align-top text-sm text-slate-600 dark:text-slate-300">
                                                <div className="space-y-1.5">
                                                    {asset.gateway && (
                                                        <div className="flex items-center gap-2">
                                                            <Router className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                            <span className="truncate font-mono">{asset.gateway}</span>
                                                        </div>
                                                    )}
                                                    {asset.subnetMask && (
                                                        <div className="font-mono text-xs text-slate-500">{asset.subnetMask}</div>
                                                    )}
                                                    {asset.dnsServer && (
                                                        <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
                                                            <Wifi className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                            <span className="truncate">{asset.dnsServer}</span>
                                                        </div>
                                                    )}
                                                    {asset.dhcpEnabled !== null && (
                                                        <div className="text-xs text-slate-400">
                                                            DHCP {asset.dhcpEnabled ? '사용' : '미사용'}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 align-top text-sm text-slate-600 dark:text-slate-300">
                                                {asset.location ? (
                                                    <div className="flex min-w-0 items-center gap-1.5">
                                                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                        <span className="truncate">{asset.location}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">미지정</span>
                                                )}
                                                {asset.notes && (
                                                    <div className="mt-2 truncate text-xs text-slate-400">
                                                        {asset.notes}
                                                    </div>
                                                )}
                                                <div className="mt-2 text-xs text-slate-400">
                                                    {formatDate(asset.updatedAt)}
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-3 py-3 text-right align-top">
                                                    <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(asset)}
                                                            className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-blue-600 dark:hover:bg-slate-900 dark:hover:text-blue-300"
                                                            aria-label="IP 수정"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(asset)}
                                                            className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-red-600 dark:hover:bg-slate-900 dark:hover:text-red-300"
                                                            aria-label="IP 삭제"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    )
                                        })}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
                    <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                                    {editingAsset ? 'IP 수정' : 'IP 추가'}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    IPv4와 사용자를 기준으로 연구실 네트워크 항목을 정리합니다.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                aria-label="닫기"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitForm} className="max-h-[calc(92vh-73px)] overflow-y-auto px-6 py-5">
                            {formError && (
                                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                                    {formError}
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">IPv4 주소</span>
                                    <input
                                        name="ipv4Address"
                                        value={form.ipv4Address}
                                        onChange={(event) => setField('ipv4Address', event.target.value)}
                                        required
                                        inputMode="decimal"
                                        placeholder="10.40.230.53"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">상태</span>
                                    <select
                                        name="status"
                                        value={form.status}
                                        onChange={(event) => setField('status', event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    >
                                        {STATUS_OPTIONS.map((status) => (
                                            <option key={status.value} value={status.value}>
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">그룹</span>
                                    <input
                                        name="groupName"
                                        value={form.groupName}
                                        onChange={(event) => setField('groupName', event.target.value)}
                                        list="network-asset-group-suggestions"
                                        placeholder="서버"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">표시 순서</span>
                                    <input
                                        name="displayOrder"
                                        type="number"
                                        value={form.displayOrder}
                                        onChange={(event) => setField('displayOrder', event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">등록 멤버</span>
                                    <select
                                        name="ownerId"
                                        value={form.ownerId}
                                        onChange={(event) => handleOwnerChange(event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">미지정</option>
                                        {owners.map((owner) => (
                                            <option key={owner.id} value={owner.id}>
                                                {owner.name || owner.email || '이름 없음'}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">표시 이름</span>
                                    <input
                                        name="ownerName"
                                        value={form.ownerName}
                                        onChange={(event) => setField('ownerName', event.target.value)}
                                        placeholder="이강연"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">MAC 주소</span>
                                    <input
                                        name="macAddress"
                                        value={form.macAddress}
                                        onChange={(event) => setField('macAddress', event.target.value)}
                                        placeholder="74-56-3C-6C-3F-D9"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">위치</span>
                                    <input
                                        name="location"
                                        value={form.location}
                                        onChange={(event) => setField('location', event.target.value)}
                                        placeholder="랩실 / 데스크 / 장비실"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">장비명</span>
                                    <input
                                        name="deviceName"
                                        value={form.deviceName}
                                        onChange={(event) => setField('deviceName', event.target.value)}
                                        placeholder="Realtek Gaming 2.5GbE Family Controller"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">어댑터</span>
                                    <input
                                        name="adapterName"
                                        value={form.adapterName}
                                        onChange={(event) => setField('adapterName', event.target.value)}
                                        placeholder="이더넷"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">서브넷 마스크</span>
                                    <input
                                        name="subnetMask"
                                        value={form.subnetMask}
                                        onChange={(event) => setField('subnetMask', event.target.value)}
                                        inputMode="decimal"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">게이트웨이</span>
                                    <input
                                        name="gateway"
                                        value={form.gateway}
                                        onChange={(event) => setField('gateway', event.target.value)}
                                        inputMode="decimal"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">DNS</span>
                                    <input
                                        name="dnsServer"
                                        value={form.dnsServer}
                                        onChange={(event) => setField('dnsServer', event.target.value)}
                                        inputMode="decimal"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">DHCP</span>
                                    <select
                                        name="dhcpEnabled"
                                        value={form.dhcpEnabled}
                                        onChange={(event) => setField('dhcpEnabled', event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">미기록</option>
                                        <option value="false">미사용</option>
                                        <option value="true">사용</option>
                                    </select>
                                </label>

                                <label className="space-y-2 md:col-span-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">IPv6 주소</span>
                                    <input
                                        name="ipv6Address"
                                        value={form.ipv6Address}
                                        onChange={(event) => setField('ipv6Address', event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2 md:col-span-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">메모</span>
                                    <textarea
                                        name="notes"
                                        value={form.notes}
                                        onChange={(event) => setField('notes', event.target.value)}
                                        rows={3}
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isPending}
                                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    저장
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
                    <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                                    ipconfig 텍스트 붙여넣기
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    10.40.230.* 주소만 등록하고 WSL, Hyper-V, Bluetooth 같은 가상 어댑터는 제외합니다.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeImportModal}
                                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                aria-label="닫기"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitImport} className="max-h-[calc(92vh-73px)] overflow-y-auto px-6 py-5">
                            {importError && (
                                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                                    {importError}
                                </div>
                            )}
                            {importMessage && (
                                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                                    {importMessage}
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">등록 멤버</span>
                                    <select
                                        name="ownerId"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">기존 담당자 유지 / 미지정</option>
                                        {owners.map((owner) => (
                                            <option key={owner.id} value={owner.id}>
                                                {owner.name || owner.email || '이름 없음'}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">표시 이름</span>
                                    <input
                                        name="ownerName"
                                        placeholder="선택 멤버와 다르게 표시할 때만 입력"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">상태</span>
                                    <select
                                        name="status"
                                        defaultValue="IN_USE"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    >
                                        {STATUS_OPTIONS.map((status) => (
                                            <option key={status.value} value={status.value}>
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">그룹</span>
                                    <input
                                        name="groupName"
                                        defaultValue="일반"
                                        list="network-asset-group-suggestions"
                                        placeholder="서버"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">위치</span>
                                    <input
                                        name="location"
                                        placeholder="랩실 / 데스크 / 장비실"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2 md:col-span-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">ipconfig 출력</span>
                                    <textarea
                                        name="ipconfigText"
                                        required
                                        rows={14}
                                        placeholder="Windows IP 구성&#10;&#10;이더넷 어댑터 이더넷:&#10;   설명. . . : Intel(R) Ethernet...&#10;   IPv4 주소 . . . : 10.40.230.48(기본 설정)"
                                        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2 md:col-span-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">메모</span>
                                    <textarea
                                        name="notes"
                                        rows={2}
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={closeImportModal}
                                    disabled={isPending}
                                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    닫기
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    파싱해서 등록
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
