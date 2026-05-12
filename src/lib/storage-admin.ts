import 'server-only'

import { supabaseAdmin } from '@/lib/supabase'
import { extractStoragePath, getProxyUrl } from '@/lib/storage-constants'
import { getStorageBucketForPath, PRIVATE_STORAGE_BUCKET } from '@/lib/storage-policy'

let privateBucketReady: Promise<void> | null = null

function encodeStoragePath(filePath: string) {
  return filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

export async function ensurePrivateStorageBucket() {
  if (!privateBucketReady) {
    privateBucketReady = (async () => {
      const { data: buckets, error } = await supabaseAdmin.storage.listBuckets()

      if (error) {
        throw error
      }

      const exists = buckets?.some((bucket) => bucket.name === PRIVATE_STORAGE_BUCKET)
      if (exists) {
        return
      }

      const { error: createError } = await supabaseAdmin.storage.createBucket(PRIVATE_STORAGE_BUCKET, {
        public: false,
        fileSizeLimit: 100 * 1024 * 1024,
      })

      if (createError && !/already exists/i.test(createError.message)) {
        throw createError
      }
    })()
  }

  return privateBucketReady
}

async function ensureBucketForPath(filePath: string) {
  if (getStorageBucketForPath(filePath) === PRIVATE_STORAGE_BUCKET) {
    await ensurePrivateStorageBucket()
  }
}

export async function uploadStorageObject(
  filePath: string,
  data: Buffer | Uint8Array | ArrayBuffer,
  options: {
    contentType?: string
    upsert?: boolean
  } = {}
) {
  const bucket = getStorageBucketForPath(filePath)
  await ensureBucketForPath(filePath)

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, data, {
      contentType: options.contentType,
      upsert: options.upsert ?? true,
    })

  return {
    error,
    bucket,
    url: error ? null : getProxyUrl(filePath),
  }
}

export async function removeStoragePaths(filePaths: string[]) {
  const normalizedPaths = [...new Set(filePaths.filter(Boolean))]

  if (normalizedPaths.length === 0) {
    return []
  }

  const groupedPaths = new Map<string, string[]>()

  for (const filePath of normalizedPaths) {
    const bucket = getStorageBucketForPath(filePath)
    const bucketPaths = groupedPaths.get(bucket) ?? []
    bucketPaths.push(filePath)
    groupedPaths.set(bucket, bucketPaths)
  }

  const results = []
  for (const [bucket, bucketPaths] of groupedPaths.entries()) {
    if (bucket === PRIVATE_STORAGE_BUCKET) {
      await ensurePrivateStorageBucket()
    }

    results.push(
      supabaseAdmin.storage
        .from(bucket)
        .remove(bucketPaths)
    )
  }

  return Promise.all(results)
}

export async function removeStorageUrl(url: string | null | undefined) {
  const filePath = url ? extractStoragePath(url) : null

  if (!filePath) {
    return null
  }

  const [result] = await removeStoragePaths([filePath])
  return result
}

export async function createStorageObjectUrl(filePath: string, expiresInSeconds: number = 60) {
  const bucket = getStorageBucketForPath(filePath)

  if (bucket === PRIVATE_STORAGE_BUCKET) {
    await ensurePrivateStorageBucket()

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresInSeconds)

    if (error || !data?.signedUrl) {
      throw error || new Error('Signed URL을 생성하지 못했습니다.')
    }

    return data.signedUrl
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeStoragePath(filePath)}`
}
