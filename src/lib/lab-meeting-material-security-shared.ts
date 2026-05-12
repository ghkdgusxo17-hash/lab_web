export const LAB_MEETING_PRIVATE_BUCKET = 'lab-meeting-private'

const SECURE_STORAGE_PREFIX = 'secure-storage://'

interface StoredLocation {
  bucket: string
  path: string
  isPrivate: boolean
}

export function buildSecureStorageUrl(bucket: string, path: string) {
  return `${SECURE_STORAGE_PREFIX}${bucket}/${path.replace(/^\/+/, '')}`
}

export function parseSecureStorageLocation(url: string): StoredLocation | null {
  if (!url.startsWith(SECURE_STORAGE_PREFIX)) {
    return null
  }

  const withoutPrefix = url.slice(SECURE_STORAGE_PREFIX.length)
  const slashIndex = withoutPrefix.indexOf('/')

  if (slashIndex === -1) {
    return null
  }

  const bucket = withoutPrefix.slice(0, slashIndex).trim()
  const path = withoutPrefix.slice(slashIndex + 1).trim()

  if (!bucket || !path) {
    return null
  }

  return {
    bucket,
    path,
    isPrivate: true,
  }
}

export function getLabMeetingMaterialAccessPath(materialId: string) {
  return `/api/materials/${materialId}/file`
}

export function buildLabMeetingMaterialAbsoluteAccessUrl(baseUrl: string, materialId: string, token?: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, '')
  const url = new URL(`${normalizedBase}${getLabMeetingMaterialAccessPath(materialId)}`)

  if (token) {
    url.searchParams.set('token', token)
  }

  return url.toString()
}
