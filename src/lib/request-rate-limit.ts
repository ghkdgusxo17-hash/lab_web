import 'server-only'

import crypto from 'crypto'
import { headers } from 'next/headers'

function getClientIp(headerStore: Headers) {
  const forwardedFor = headerStore.get('cf-connecting-ip')
    || headerStore.get('x-real-ip')
    || headerStore.get('x-forwarded-for')
    || ''

  const firstIp = forwardedFor.split(',')[0]?.trim()
  return firstIp || 'unknown-ip'
}

function maskIpAddress(ipAddress: string) {
  if (!ipAddress || ipAddress === 'unknown-ip') {
    return 'unknown-ip'
  }

  if (ipAddress.includes('.')) {
    const segments = ipAddress.split('.')
    if (segments.length === 4) {
      return `${segments[0]}.${segments[1]}.${segments[2]}.xxx`
    }
  }

  if (ipAddress.includes(':')) {
    const segments = ipAddress.split(':').filter(Boolean)
    const visible = segments.slice(0, 3)
    return `${visible.join(':')}:****`
  }

  return ipAddress
}

function normalizeSeed(value: string | null | undefined) {
  return String(value ?? '').trim().toLowerCase().slice(0, 200)
}

function normalizeUserAgent(value: string | null | undefined) {
  return String(value ?? '').trim().slice(0, 300)
}

export async function getClientRequestMetadata() {
  const headerStore = await headers()
  const clientIp = getClientIp(headerStore)
  const userAgent = normalizeUserAgent(headerStore.get('user-agent'))

  return {
    ipAddress: clientIp,
    ipMasked: maskIpAddress(clientIp),
    userAgent: userAgent || null,
  }
}

export async function getRequestRateLimitKey(scope: string, seed?: string) {
  const { ipAddress, userAgent } = await getClientRequestMetadata()
  const normalizedScope = normalizeSeed(scope)
  const normalizedSeed = normalizeSeed(seed)

  return crypto
    .createHash('sha256')
    .update(`${normalizedScope}|${ipAddress}|${normalizeSeed(userAgent)}|${normalizedSeed}`)
    .digest('hex')
}
