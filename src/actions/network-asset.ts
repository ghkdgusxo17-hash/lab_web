'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { normalizeIpv4Address, normalizeMacAddress } from '@/lib/network-address'
import { parseIpconfigNetworkAssets } from '@/lib/ipconfig-parser'

const NETWORK_ASSET_STATUSES = ['IN_USE', 'RESERVED', 'AVAILABLE', 'RETIRED'] as const

type NetworkAssetStatus = (typeof NETWORK_ASSET_STATUSES)[number]

type NetworkAssetFilters = {
    status?: string
    search?: string
}

type NetworkSession = {
    user?: {
        role?: string | null
        isApproved?: boolean | null
        isAdmin?: boolean | null
    }
} | null

function hasNetworkAssetAccess(session: NetworkSession) {
    if (!session?.user) return false
    if (session.user.role === 'ALUMNI') return false
    return Boolean(session.user.isApproved || session.user.isAdmin)
}

async function requireViewer() {
    const session = await auth()
    if (!hasNetworkAssetAccess(session)) {
        return { error: '승인된 연구실 멤버만 IP 관리를 볼 수 있습니다.' }
    }
    return { session }
}

async function requireAdmin() {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        return { error: '관리자만 IP 정보를 변경할 수 있습니다.' }
    }
    return { session }
}

function emptyToNull(value: FormDataEntryValue | null) {
    const text = typeof value === 'string' ? value.trim() : ''
    return text || null
}

function normalizeStatus(value: FormDataEntryValue | null): NetworkAssetStatus {
    const status = typeof value === 'string' ? value : ''
    return NETWORK_ASSET_STATUSES.includes(status as NetworkAssetStatus)
        ? status as NetworkAssetStatus
        : 'IN_USE'
}

function parseDhcpEnabled(value: FormDataEntryValue | null) {
    if (value === 'true') return true
    if (value === 'false') return false
    return null
}

function parseDisplayOrder(value: FormDataEntryValue | null) {
    const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : 0
    return Number.isFinite(parsed) ? parsed : 0
}

function normalizeGroupName(value: FormDataEntryValue | null) {
    return emptyToNull(value) ?? '일반'
}

function ipSortValue(ip: string) {
    return ip
        .split('.')
        .map((part) => Number(part).toString().padStart(3, '0'))
        .join('.')
}

function sortNetworkAssets<T extends { ipv4Address: string; groupName?: string | null; displayOrder?: number | null }>(items: T[]) {
    return [...items].sort((a, b) => ipSortValue(a.ipv4Address).localeCompare(ipSortValue(b.ipv4Address)))
        .sort((a, b) => {
            const groupCompare = (a.groupName ?? '일반').localeCompare(b.groupName ?? '일반', 'ko-KR')
            if (groupCompare !== 0) return groupCompare
            const orderCompare = (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
            if (orderCompare !== 0) return orderCompare
            return 0
        })
}

async function validateUniqueAddress(ipv4Address: string, macAddress: string | null, currentId?: string) {
    const existingIp = await prisma.networkAsset.findUnique({ where: { ipv4Address } })
    if (existingIp && existingIp.id !== currentId) {
        return '이미 등록된 IPv4 주소입니다.'
    }

    if (macAddress) {
        const existingMac = await prisma.networkAsset.findUnique({ where: { macAddress } })
        if (existingMac && existingMac.id !== currentId) {
            return '이미 등록된 MAC 주소입니다.'
        }
    }

    return null
}

function networkAssetWhere(filters?: NetworkAssetFilters) {
    const where: any = {}

    if (filters?.status && NETWORK_ASSET_STATUSES.includes(filters.status as NetworkAssetStatus)) {
        where.status = filters.status
    }

    const search = filters?.search?.trim()
    if (search) {
        where.OR = [
            { ipv4Address: { contains: search, mode: 'insensitive' } },
            { ipv6Address: { contains: search, mode: 'insensitive' } },
            { macAddress: { contains: search, mode: 'insensitive' } },
            { ownerName: { contains: search, mode: 'insensitive' } },
            { deviceName: { contains: search, mode: 'insensitive' } },
            { adapterName: { contains: search, mode: 'insensitive' } },
            { location: { contains: search, mode: 'insensitive' } },
            { groupName: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
            { owner: { is: { name: { contains: search, mode: 'insensitive' } } } },
        ]
    }

    return where
}

export async function getNetworkAssets(filters?: NetworkAssetFilters) {
    const access = await requireViewer()
    if ('error' in access) return []

    const assets = await prisma.networkAsset.findMany({
        where: networkAssetWhere(filters),
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            },
        },
    })

    return sortNetworkAssets(assets)
}

export async function getNetworkAssetSummary() {
    const session = await auth()
    if (!hasNetworkAssetAccess(session)) {
        return {
            total: 0,
            inUse: 0,
            reserved: 0,
            available: 0,
            retired: 0,
            unassigned: 0,
        }
    }

    const assets = await prisma.networkAsset.findMany({
        select: {
            status: true,
            ownerId: true,
            ownerName: true,
        },
    })

    return {
        total: assets.length,
        inUse: assets.filter((asset) => asset.status === 'IN_USE').length,
        reserved: assets.filter((asset) => asset.status === 'RESERVED').length,
        available: assets.filter((asset) => asset.status === 'AVAILABLE').length,
        retired: assets.filter((asset) => asset.status === 'RETIRED').length,
        unassigned: assets.filter((asset) => !asset.ownerId && !asset.ownerName).length,
    }
}

export async function getNetworkAssetOwnerOptions() {
    const access = await requireAdmin()
    if ('error' in access) return []

    return prisma.user.findMany({
        where: {
            isApproved: true,
            role: { not: 'ALUMNI' },
        },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
        },
        orderBy: [
            { role: 'asc' },
            { name: 'asc' },
        ],
    })
}

function readNetworkAssetForm(formData: FormData) {
    const ipv4Address = normalizeIpv4Address(formData.get('ipv4Address') as string)
    const rawMacAddress = emptyToNull(formData.get('macAddress'))
    const macAddress = rawMacAddress ? normalizeMacAddress(rawMacAddress) : null

    if (!ipv4Address) {
        return { error: '올바른 IPv4 주소를 입력해 주세요.' }
    }

    if (rawMacAddress && !macAddress) {
        return { error: '올바른 MAC 주소를 입력해 주세요.' }
    }

    return {
        data: {
            ownerId: emptyToNull(formData.get('ownerId')),
            ownerName: emptyToNull(formData.get('ownerName')),
            deviceName: emptyToNull(formData.get('deviceName')),
            adapterName: emptyToNull(formData.get('adapterName')),
            ipv4Address,
            ipv6Address: emptyToNull(formData.get('ipv6Address')),
            macAddress,
            subnetMask: emptyToNull(formData.get('subnetMask')),
            gateway: emptyToNull(formData.get('gateway')),
            dnsServer: emptyToNull(formData.get('dnsServer')),
            dhcpEnabled: parseDhcpEnabled(formData.get('dhcpEnabled')),
            location: emptyToNull(formData.get('location')),
            groupName: normalizeGroupName(formData.get('groupName')),
            displayOrder: parseDisplayOrder(formData.get('displayOrder')),
            status: normalizeStatus(formData.get('status')),
            notes: emptyToNull(formData.get('notes')),
        },
    }
}

export async function createNetworkAsset(formData: FormData) {
    const access = await requireAdmin()
    if ('error' in access) return access

    const parsed = readNetworkAssetForm(formData)
    if ('error' in parsed) return { error: parsed.error }

    const uniqueError = await validateUniqueAddress(parsed.data.ipv4Address, parsed.data.macAddress)
    if (uniqueError) return { error: uniqueError }

    const asset = await prisma.networkAsset.create({
        data: parsed.data,
    })

    revalidatePath('/inventory')
    revalidatePath('/inventory/ip')
    return { success: true, assetId: asset.id }
}

export async function updateNetworkAsset(id: string, formData: FormData) {
    const access = await requireAdmin()
    if ('error' in access) return access

    const parsed = readNetworkAssetForm(formData)
    if ('error' in parsed) return { error: parsed.error }

    const uniqueError = await validateUniqueAddress(parsed.data.ipv4Address, parsed.data.macAddress, id)
    if (uniqueError) return { error: uniqueError }

    await prisma.networkAsset.update({
        where: { id },
        data: parsed.data,
    })

    revalidatePath('/inventory')
    revalidatePath('/inventory/ip')
    return { success: true }
}

export async function deleteNetworkAsset(id: string) {
    const access = await requireAdmin()
    if ('error' in access) return access

    await prisma.networkAsset.delete({
        where: { id },
    })

    revalidatePath('/inventory')
    revalidatePath('/inventory/ip')
    return { success: true }
}

export async function importNetworkAssetsFromIpconfigText(formData: FormData) {
    const access = await requireAdmin()
    if ('error' in access) return access

    const text = emptyToNull(formData.get('ipconfigText'))
    if (!text) {
        return { error: '붙여넣을 ipconfig 텍스트를 입력해 주세요.' }
    }

    if (text.length > 30000) {
        return { error: 'ipconfig 텍스트는 30,000자 이하로 입력해 주세요.' }
    }

    const parsedAssets = parseIpconfigNetworkAssets(text)
    if (parsedAssets.length === 0) {
        return { error: '등록 가능한 10.40.230.* IP를 찾지 못했습니다.' }
    }

    const ownerId = emptyToNull(formData.get('ownerId'))
    const manualOwnerName = emptyToNull(formData.get('ownerName'))
    const location = emptyToNull(formData.get('location'))
    const groupName = normalizeGroupName(formData.get('groupName'))
    const status = normalizeStatus(formData.get('status'))
    const manualNotes = emptyToNull(formData.get('notes'))

    let owner: { id: string; name: string | null } | null = null
    if (ownerId) {
        owner = await prisma.user.findUnique({
            where: { id: ownerId },
            select: { id: true, name: true },
        })
    }

    let created = 0
    let updated = 0
    let skipped = 0

    for (const asset of parsedAssets) {
        if (asset.macAddress) {
            const existingByMac = await prisma.networkAsset.findUnique({
                where: { macAddress: asset.macAddress },
                select: { id: true, ipv4Address: true },
            })

            if (existingByMac && existingByMac.ipv4Address !== asset.ipv4Address) {
                skipped += 1
                continue
            }
        }

        const existingByIp = await prisma.networkAsset.findUnique({
            where: { ipv4Address: asset.ipv4Address },
            select: { id: true, ownerId: true, ownerName: true, displayOrder: true },
        })

        const parsedNotes = [
            asset.hostName ? `호스트: ${asset.hostName}` : null,
            asset.adapterDescription ? `어댑터 설명: ${asset.adapterDescription}` : null,
            manualNotes,
        ].filter(Boolean).join('\n')

        const data = {
            ownerId: owner?.id ?? (manualOwnerName ? null : existingByIp?.ownerId ?? null),
            ownerName: manualOwnerName ?? owner?.name ?? existingByIp?.ownerName ?? null,
            deviceName: asset.hostName ?? asset.adapterDescription ?? null,
            adapterName: asset.adapterName ?? null,
            ipv6Address: asset.ipv6Address ?? null,
            macAddress: asset.macAddress ?? null,
            subnetMask: asset.subnetMask ?? null,
            gateway: asset.gateway ?? null,
            dnsServer: asset.dnsServer ?? null,
            dhcpEnabled: asset.dhcpEnabled ?? null,
            location,
            groupName,
            displayOrder: existingByIp?.displayOrder ?? 0,
            status,
            source: 'ipconfig text',
            notes: parsedNotes || null,
        }

        if (existingByIp) {
            await prisma.networkAsset.update({
                where: { id: existingByIp.id },
                data,
            })
            updated += 1
        } else {
            await prisma.networkAsset.create({
                data: {
                    ...data,
                    ipv4Address: asset.ipv4Address,
                },
            })
            created += 1
        }
    }

    revalidatePath('/inventory')
    revalidatePath('/inventory/ip')
    return { success: true, created, updated, skipped, parsed: parsedAssets.length }
}
