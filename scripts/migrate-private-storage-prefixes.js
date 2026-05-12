const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')

const rootDir = path.resolve(__dirname, '..')
const PUBLIC_BUCKET = 'uploads'
const PRIVATE_BUCKET = 'uploads-private'

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const content = fs.readFileSync(filePath, 'latin1')
  const lines = content.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

function extractStoragePath(url) {
  if (!url) {
    return null
  }

  const proxyPrefix = `/api/storage/${PUBLIC_BUCKET}/`
  if (url.includes(proxyPrefix)) {
    return url.split(proxyPrefix)[1] || null
  }

  const directPrefix = `/storage/v1/object/public/${PUBLIC_BUCKET}/`
  if (url.includes(directPrefix)) {
    return url.split(directPrefix)[1] || null
  }

  return null
}

function isPrivateStoragePath(filePath) {
  if (!filePath || filePath.startsWith('workspace/images/')) {
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

async function ensurePrivateBucket(supabase) {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) {
    throw error
  }

  const exists = buckets && buckets.some((bucket) => bucket.name === PRIVATE_BUCKET)
  if (exists) {
    return
  }

  const { error: createError } = await supabase.storage.createBucket(PRIVATE_BUCKET, {
    public: false,
    fileSizeLimit: 100 * 1024 * 1024,
  })

  if (createError && !/already exists/i.test(createError.message)) {
    throw createError
  }
}

async function collectReferencedPaths(prisma) {
  const [
    materials,
    inventoryItems,
    purchaseRequests,
    taskAttachments,
    workspaceResources,
    transcriptions,
  ] = await Promise.all([
    prisma.material.findMany({ select: { url: true } }),
    prisma.inventoryItem.findMany({ select: { msdsUrl: true } }),
    prisma.purchaseRequest.findMany({ select: { quotationUrl: true, receiptUrl: true } }),
    prisma.taskAttachment.findMany({ select: { url: true } }),
    prisma.workspaceResource.findMany({
      where: { type: 'FILE' },
      select: { url: true },
    }),
    prisma.meetingTranscription.findMany({ select: { audioUrl: true } }),
  ])

  const paths = new Set()

  const addPath = (value) => {
    const storagePath = extractStoragePath(value)
    if (storagePath && isPrivateStoragePath(storagePath)) {
      paths.add(storagePath)
    }
  }

  materials.forEach((item) => addPath(item.url))
  inventoryItems.forEach((item) => addPath(item.msdsUrl))
  purchaseRequests.forEach((item) => {
    addPath(item.quotationUrl)
    addPath(item.receiptUrl)
  })
  taskAttachments.forEach((item) => addPath(item.url))
  workspaceResources.forEach((item) => addPath(item.url))
  transcriptions.forEach((item) => addPath(item.audioUrl))

  return [...paths].sort()
}

async function objectExists(supabase, bucket, filePath) {
  const { data, error } = await supabase.storage.from(bucket).download(filePath)
  if (error || !data) {
    return false
  }

  return true
}

async function main() {
  loadEnvFile(path.join(rootDir, '.env.local'))
  loadEnvFile(path.join(rootDir, '.env.development.local'))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!process.env.REAL_DATABASE_URL || !supabaseUrl || !supabaseServiceKey) {
    throw new Error('Required environment variables are missing.')
  }

  const prisma = new PrismaClient()
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  await ensurePrivateBucket(supabase)

  const referencedPaths = await collectReferencedPaths(prisma)

  let migrated = 0
  let skipped = 0
  let missing = 0
  let failed = 0

  for (const filePath of referencedPaths) {
    try {
      const { data: publicFile, error: publicDownloadError } = await supabase.storage
        .from(PUBLIC_BUCKET)
        .download(filePath)

      if (publicDownloadError || !publicFile) {
        const alreadyPrivate = await objectExists(supabase, PRIVATE_BUCKET, filePath)
        if (alreadyPrivate) {
          skipped += 1
          console.log(`[skipped] already private: ${filePath}`)
        } else {
          missing += 1
          console.warn(`[missing] ${filePath}`)
        }
        continue
      }

      const buffer = Buffer.from(await publicFile.arrayBuffer())
      const { error: uploadError } = await supabase.storage
        .from(PRIVATE_BUCKET)
        .upload(filePath, buffer, {
          contentType: publicFile.type || undefined,
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      const { error: removeError } = await supabase.storage
        .from(PUBLIC_BUCKET)
        .remove([filePath])

      if (removeError) {
        console.warn(`[warn] public remove failed: ${filePath} (${removeError.message})`)
      }

      migrated += 1
      console.log(`[migrated] ${filePath}`)
    } catch (error) {
      failed += 1
      console.error(`[failed] ${filePath}`, error)
    }
  }

  await prisma.$disconnect()

  console.log('')
  console.log(`Migration complete. migrated=${migrated}, skipped=${skipped}, missing=${missing}, failed=${failed}`)
}

main().catch((error) => {
  console.error('Private storage migration failed:', error)
  process.exitCode = 1
})
