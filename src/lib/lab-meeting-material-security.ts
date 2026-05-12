import 'server-only'

import { SignJWT, jwtVerify } from 'jose'
import { supabaseAdmin } from '@/lib/supabase'
import { STORAGE_BUCKET, extractStoragePath } from '@/lib/storage-constants'
import { getStorageBucketForPath, isPrivateStoragePath } from '@/lib/storage-policy'
import {
  LAB_MEETING_PRIVATE_BUCKET,
  buildLabMeetingMaterialAbsoluteAccessUrl,
  buildSecureStorageUrl,
  parseSecureStorageLocation,
} from '@/lib/lab-meeting-material-security-shared'

const MATERIAL_ACCESS_SECRET = new TextEncoder().encode(
  process.env.MATERIAL_ACCESS_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'material-access-secret'
)

interface StoredLocation {
  bucket: string
  path: string
  isPrivate: boolean
}

function encodePath(path: string) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

export { LAB_MEETING_PRIVATE_BUCKET, buildLabMeetingMaterialAbsoluteAccessUrl, buildSecureStorageUrl }

export function parseStoredMaterialLocation(url: string): StoredLocation | null {
  const secureLocation = parseSecureStorageLocation(url)
  if (secureLocation) {
    return secureLocation
  }

  const storagePath = extractStoragePath(url)

  if (!storagePath) {
    return null
  }

  return {
    bucket: getStorageBucketForPath(storagePath),
    path: storagePath,
    isPrivate: isPrivateStoragePath(storagePath),
  }
}

export async function ensureLabMeetingPrivateBucket() {
  const { data: buckets, error } = await supabaseAdmin.storage.listBuckets()

  if (error) {
    throw error
  }

  const exists = buckets?.some((bucket) => bucket.name === LAB_MEETING_PRIVATE_BUCKET)

  if (exists) {
    return
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(LAB_MEETING_PRIVATE_BUCKET, {
    public: false,
    fileSizeLimit: 100 * 1024 * 1024,
  })

  if (createError && !/already exists/i.test(createError.message)) {
    throw createError
  }
}

export async function createLabMeetingMaterialAccessToken(materialId: string, expiresIn: string = '10m') {
  return new SignJWT({
    materialId,
    purpose: 'lab-meeting-material-access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(MATERIAL_ACCESS_SECRET)
}

export async function verifyLabMeetingMaterialAccessToken(token: string, expectedMaterialId: string) {
  if (!token) {
    return false
  }

  try {
    const { payload } = await jwtVerify(token, MATERIAL_ACCESS_SECRET)
    return payload.purpose === 'lab-meeting-material-access' && payload.materialId === expectedMaterialId
  } catch {
    return false
  }
}

export async function createSupabaseObjectUrl(location: StoredLocation, expiresInSeconds: number = 60) {
  if (location.isPrivate) {
    const { data, error } = await supabaseAdmin.storage
      .from(location.bucket)
      .createSignedUrl(location.path, expiresInSeconds)

    if (error || !data?.signedUrl) {
      throw error || new Error('Signed URL을 생성하지 못했습니다.')
    }

    return data.signedUrl
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
  return `${supabaseUrl}/storage/v1/object/public/${location.bucket}/${encodePath(location.path)}`
}
