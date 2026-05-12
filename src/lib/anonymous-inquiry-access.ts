import crypto from 'crypto'

const ACCESS_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const HASH_PATTERN = /^[a-f0-9]{64}$/i

function randomCode(length: number, alphabet: string) {
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

function getAnonymousInquirySecret() {
  const secret =
    process.env.ANONYMOUS_INQUIRY_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim()

  if (!secret) {
    throw new Error('Anonymous inquiry access secret is not configured.')
  }

  return secret
}

export function normalizeAnonymousInquiryRoomCode(value: string) {
  return String(value ?? '').trim().toUpperCase()
}

export function normalizeAnonymousInquiryAccessToken(value: string | null | undefined) {
  return String(value ?? '').trim().toUpperCase()
}

export function createAnonymousInquiryAccessToken() {
  return randomCode(18, ACCESS_ALPHABET)
}

export function hashAnonymousInquiryAccessToken(value: string) {
  const normalized = normalizeAnonymousInquiryAccessToken(value)

  if (!normalized) {
    return ''
  }

  return crypto.createHmac('sha256', getAnonymousInquirySecret()).update(normalized).digest('hex')
}

export function isHashedAnonymousInquiryAccessValue(value: string) {
  return HASH_PATTERN.test(String(value ?? '').trim())
}

export function isAnonymousInquiryAccessTokenValid(storedValue: string, candidate: string) {
  const normalizedCandidate = normalizeAnonymousInquiryAccessToken(candidate)
  const normalizedStored = String(storedValue ?? '').trim()

  if (!normalizedCandidate || !normalizedStored) {
    return false
  }

  if (isHashedAnonymousInquiryAccessValue(normalizedStored)) {
    const expectedHash = hashAnonymousInquiryAccessToken(normalizedCandidate)
    return crypto.timingSafeEqual(Buffer.from(normalizedStored.toLowerCase()), Buffer.from(expectedHash))
  }

  return normalizeAnonymousInquiryAccessToken(normalizedStored) === normalizedCandidate
}

export function getAnonymousInquiryAccessCookieName(roomCode: string) {
  const normalizedRoomCode = normalizeAnonymousInquiryRoomCode(roomCode)
  const suffix = normalizedRoomCode.replace(/[^A-Z0-9]/g, '_').toLowerCase()
  return `cpe_anonymous_room_${suffix}`
}

export function getAnonymousInquiryConnectPath(roomCode: string, accessToken: string) {
  const normalizedRoomCode = normalizeAnonymousInquiryRoomCode(roomCode)
  const normalizedAccessToken = normalizeAnonymousInquiryAccessToken(accessToken)
  const params = new URLSearchParams({ token: normalizedAccessToken })

  return `/contact/anonymous/${normalizedRoomCode}/connect?${params.toString()}`
}
