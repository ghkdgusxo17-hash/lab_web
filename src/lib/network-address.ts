export function normalizeIpv4Address(value: string | null | undefined) {
    const cleaned = (value ?? '').replace(/\(.*?\)/g, '').trim()
    const parts = cleaned.split('.')
    if (parts.length !== 4) return null

    const octets = parts.map((part) => Number(part))
    if (octets.some((octet, index) => !/^\d+$/.test(parts[index]) || octet < 0 || octet > 255)) {
        return null
    }

    return octets.join('.')
}

export function normalizeMacAddress(value: string | null | undefined) {
    const hex = (value ?? '').replace(/[^a-fA-F0-9]/g, '').toUpperCase()
    if (hex.length !== 12) return null

    return hex.match(/.{1,2}/g)?.join(':') ?? null
}
