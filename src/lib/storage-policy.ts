import { STORAGE_BUCKET } from '@/lib/storage-constants'

export const PRIVATE_STORAGE_BUCKET = 'uploads-private'

export type StorageAccessLevel = 'public' | 'authenticated' | 'member'

const PUBLIC_PREFIXES = [
  'profiles/',
  'professor/',
  'resources/',
  'workspace/images/',
  'attachments/',
  'papers/',
]

export function isPublicStoragePath(filePath: string) {
  return PUBLIC_PREFIXES.some((prefix) => filePath.startsWith(prefix))
}

export function isPrivateStoragePath(filePath: string) {
  if (filePath.startsWith('workspace/images/')) {
    return false
  }

  return (
    filePath.startsWith('materials/') ||
    filePath.startsWith('inventory/') ||
    filePath.startsWith('task-attachments/') ||
    filePath.startsWith('transcriptions/') ||
    filePath.startsWith('workspace/')
  )
}

export function getStorageBucketForPath(filePath: string) {
  return isPrivateStoragePath(filePath) ? PRIVATE_STORAGE_BUCKET : STORAGE_BUCKET
}

export function getStorageAccessLevel(filePath: string): StorageAccessLevel {
  if (isPublicStoragePath(filePath)) {
    return 'public'
  }

  if (isPrivateStoragePath(filePath)) {
    return 'member'
  }

  return 'authenticated'
}
