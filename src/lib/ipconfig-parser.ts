import { normalizeIpv4Address, normalizeMacAddress } from '@/lib/network-address'

export type ParsedIpconfigAsset = {
    hostName?: string | null
    adapterName?: string | null
    adapterDescription?: string | null
    ipv4Address: string
    ipv6Address?: string | null
    macAddress?: string | null
    subnetMask?: string | null
    gateway?: string | null
    dnsServer?: string | null
    dhcpEnabled?: boolean | null
}

type AdapterBlock = Partial<ParsedIpconfigAsset> & {
    mediaDisconnected?: boolean
}

type ParseOptions = {
    labPrefix?: string
}

const VIRTUAL_ADAPTER_PATTERN = /bluetooth|vEthernet|Hyper-V|Virtual|WSL|VMware|VirtualBox|Loopback|Tunnel|TAP|블루투스/i

function cleanValue(value: string) {
    return value.replace(/\(.*?\)/g, '').trim()
}

function parseBoolean(value: string) {
    const normalized = value.trim().toLowerCase()
    if (['예', 'yes', 'true', '1'].includes(normalized)) return true
    if (['아니요', 'no', 'false', '0'].includes(normalized)) return false
    return null
}

function adapterNameFromLine(line: string) {
    const trimmed = line.trim()
    if (!trimmed.endsWith(':') || !trimmed.includes('어댑터')) return null

    const withoutColon = trimmed.slice(0, -1)
    return withoutColon.replace(/^.*?어댑터\s+/, '').trim() || withoutColon
}

function isVirtualAdapter(block: AdapterBlock) {
    return VIRTUAL_ADAPTER_PATTERN.test(`${block.adapterName ?? ''} ${block.adapterDescription ?? ''}`)
}

function applyField(block: AdapterBlock, line: string) {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex < 0) return

    const key = line.slice(0, separatorIndex).replace(/[.\s]/g, '')
    const value = cleanValue(line.slice(separatorIndex + 1))

    if (key.includes('미디어상태') && value.includes('연결 끊김')) {
        block.mediaDisconnected = true
    } else if (key.includes('설명')) {
        block.adapterDescription = value
    } else if (key.includes('물리적주소')) {
        block.macAddress = normalizeMacAddress(value)
    } else if (key.includes('DHCP사용')) {
        block.dhcpEnabled = parseBoolean(value)
    } else if (key.includes('IPv4주소')) {
        block.ipv4Address = normalizeIpv4Address(value) ?? undefined
    } else if (key.includes('IPv6주소')) {
        block.ipv6Address = value || null
    } else if (key.includes('서브넷마스크')) {
        block.subnetMask = value || null
    } else if (key.includes('기본게이트웨이')) {
        block.gateway = value || null
    } else if (key.includes('DNS서버')) {
        block.dnsServer = value || null
    }
}

export function parseIpconfigNetworkAssets(text: string, options: ParseOptions = {}) {
    const labPrefix = options.labPrefix ?? '10.40.230.'
    const lines = text.split(/\r?\n/)
    const assets: ParsedIpconfigAsset[] = []
    let hostName: string | null = null
    let current: AdapterBlock | null = null

    const flush = () => {
        if (!current?.ipv4Address) {
            current = null
            return
        }

        const inLabSubnet = current.ipv4Address.startsWith(labPrefix)
        const shouldSkip = current.mediaDisconnected || isVirtualAdapter(current) || !inLabSubnet

        if (!shouldSkip) {
            assets.push({
                hostName,
                adapterName: current.adapterName ?? null,
                adapterDescription: current.adapterDescription ?? null,
                ipv4Address: current.ipv4Address,
                ipv6Address: current.ipv6Address ?? null,
                macAddress: current.macAddress ?? null,
                subnetMask: current.subnetMask ?? null,
                gateway: current.gateway ?? null,
                dnsServer: current.dnsServer ?? null,
                dhcpEnabled: current.dhcpEnabled ?? null,
            })
        }

        current = null
    }

    for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line) continue

        if (line.includes('호스트 이름')) {
            const separatorIndex = line.indexOf(':')
            if (separatorIndex >= 0) {
                hostName = cleanValue(line.slice(separatorIndex + 1)) || null
            }
            continue
        }

        const adapterName = adapterNameFromLine(line)
        if (adapterName) {
            flush()
            current = { hostName, adapterName }
            continue
        }

        if (current && line.includes(':')) {
            applyField(current, line)
        }
    }

    flush()

    const uniqueByIp = new Map<string, ParsedIpconfigAsset>()
    for (const asset of assets) {
        uniqueByIp.set(asset.ipv4Address, asset)
    }

    return Array.from(uniqueByIp.values())
}
