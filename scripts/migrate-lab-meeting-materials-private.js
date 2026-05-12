const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')

const rootDir = path.resolve(__dirname, '..')
const PUBLIC_BUCKET = 'uploads'
const PRIVATE_BUCKET = 'lab-meeting-private'
const SECURE_STORAGE_PREFIX = 'secure-storage://'

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

function parseStoredLocation(url) {
    if (url.startsWith(SECURE_STORAGE_PREFIX)) {
        const withoutPrefix = url.slice(SECURE_STORAGE_PREFIX.length)
        const slashIndex = withoutPrefix.indexOf('/')
        if (slashIndex === -1) {
            return null
        }

        return {
            bucket: withoutPrefix.slice(0, slashIndex),
            path: withoutPrefix.slice(slashIndex + 1),
            isPrivate: true,
        }
    }

    const pathValue = extractStoragePath(url)
    if (!pathValue) {
        return null
    }

    return {
        bucket: PUBLIC_BUCKET,
        path: pathValue,
        isPrivate: false,
    }
}

function buildSecureStorageUrl(bucket, filePath) {
    return `${SECURE_STORAGE_PREFIX}${bucket}/${filePath.replace(/^\/+/, '')}`
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

    const materials = await prisma.material.findMany({
        where: {
            labMeetingId: { not: null },
        },
        select: {
            id: true,
            filename: true,
            mimeType: true,
            url: true,
        },
        orderBy: { createdAt: 'asc' },
    })

    let migrated = 0
    let skipped = 0
    let failed = 0

    for (const material of materials) {
        const location = parseStoredLocation(material.url)

        if (!location) {
            console.warn(`[skip] invalid url for material ${material.id}`)
            skipped += 1
            continue
        }

        if (location.isPrivate && location.bucket === PRIVATE_BUCKET) {
            skipped += 1
            continue
        }

        try {
            const { data: fileData, error: downloadError } = await supabase.storage
                .from(location.bucket)
                .download(location.path)

            if (downloadError || !fileData) {
                throw downloadError || new Error('Failed to download source file.')
            }

            const buffer = Buffer.from(await fileData.arrayBuffer())
            const { error: uploadError } = await supabase.storage
                .from(PRIVATE_BUCKET)
                .upload(location.path, buffer, {
                    contentType: material.mimeType || undefined,
                    upsert: true,
                })

            if (uploadError) {
                throw uploadError
            }

            await prisma.material.update({
                where: { id: material.id },
                data: {
                    url: buildSecureStorageUrl(PRIVATE_BUCKET, location.path),
                },
            })

            if (!location.isPrivate) {
                const { error: removeError } = await supabase.storage
                    .from(location.bucket)
                    .remove([location.path])

                if (removeError) {
                    console.warn(`[warn] old public file remove failed for ${material.id}: ${removeError.message}`)
                }
            }

            migrated += 1
            console.log(`[migrated] ${material.id} -> ${location.path}`)
        } catch (error) {
            failed += 1
            console.error(`[failed] ${material.id}`, error)
        }
    }

    await prisma.$disconnect()

    console.log('')
    console.log(`Migration complete. migrated=${migrated}, skipped=${skipped}, failed=${failed}`)
}

main().catch((error) => {
    console.error('Lab meeting material migration failed:', error)
    process.exitCode = 1
})
