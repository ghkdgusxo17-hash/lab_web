const ROOM_PREFIX = 'CPE-'

function normalizeAlphaNumeric(value: string | null | undefined) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

export function normalizeAnonymousInquiryEntryRoomCode(value: string | null | undefined) {
  const normalized = normalizeAlphaNumeric(value)

  if (!normalized) {
    return ''
  }

  const suffix = normalized.startsWith('CPE') ? normalized.slice(3) : normalized
  return `${ROOM_PREFIX}${suffix.slice(0, 6)}`
}

export function normalizeAnonymousInquiryEntryToken(value: string | null | undefined) {
  return normalizeAlphaNumeric(value)
}

export function buildAnonymousInquiryConnectClientPath(roomCode: string, accessToken: string) {
  const normalizedRoomCode = normalizeAnonymousInquiryEntryRoomCode(roomCode)
  const normalizedAccessToken = normalizeAnonymousInquiryEntryToken(accessToken)
  const params = new URLSearchParams({ token: normalizedAccessToken })

  return `/contact/anonymous/${normalizedRoomCode}/connect?${params.toString()}`
}

export function buildAnonymousInquiryEntryCode(roomCode: string, accessToken: string) {
  const normalizedRoomCode = normalizeAnonymousInquiryEntryRoomCode(roomCode)
  const normalizedAccessToken = normalizeAnonymousInquiryEntryToken(accessToken)
  const roomSuffix = normalizedRoomCode.replace(/^CPE-/, '')
  const tokenGroups = normalizedAccessToken.match(/.{1,4}/g) ?? []

  if (!roomSuffix || !normalizedAccessToken) {
    return ''
  }

  return [roomSuffix, ...tokenGroups].join('-')
}

export function parseAnonymousInquiryEntryCode(value: string) {
  const compact = normalizeAlphaNumeric(value)

  if (!compact) {
    return null
  }

  const normalized = compact.startsWith('CPE') ? compact.slice(3) : compact

  if (normalized.length < 24) {
    return null
  }

  const roomSuffix = normalized.slice(0, 6)
  const accessToken = normalized.slice(6, 24)

  if (roomSuffix.length !== 6 || accessToken.length !== 18) {
    return null
  }

  return {
    roomCode: `${ROOM_PREFIX}${roomSuffix}`,
    accessToken,
  }
}

export function parseAnonymousInquiryConnectInput(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const candidate = /^(https?:)?\/\//i.test(trimmed)
    ? trimmed
    : `https://cpe.local${trimmed.startsWith('/') ? '' : '/'}${trimmed}`

  try {
    const parsed = new URL(candidate)
    const roomMatch =
      parsed.pathname.match(/^\/contact\/anonymous\/([^/?#]+)\/connect$/i) ??
      parsed.pathname.match(/^\/contact\/anonymous\/([^/?#]+)$/i)
    const roomCode = roomMatch?.[1]?.trim().toUpperCase()
    const accessToken =
      parsed.searchParams.get('token')?.trim() ?? parsed.searchParams.get('code')?.trim()

    if (!roomCode || !accessToken) {
      return null
    }

    return {
      roomCode: normalizeAnonymousInquiryEntryRoomCode(roomCode),
      accessToken: normalizeAnonymousInquiryEntryToken(accessToken),
    }
  } catch {
    return null
  }
}
