const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')

const HASH_PATTERN = /^[a-f0-9]{64}$/i
const rootDir = path.resolve(__dirname, '..')

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

function getSecret() {
  const secret =
    process.env.ANONYMOUS_INQUIRY_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET

  if (!secret) {
    throw new Error('Anonymous inquiry secret is missing.')
  }

  return secret
}

function normalizeToken(value) {
  return String(value ?? '').trim().toUpperCase()
}

function hashToken(value) {
  return crypto.createHmac('sha256', getSecret()).update(normalizeToken(value)).digest('hex')
}

async function main() {
  loadEnvFile(path.join(rootDir, '.env.local'))
  loadEnvFile(path.join(rootDir, '.env.development.local'))

  if (!process.env.REAL_DATABASE_URL) {
    throw new Error('REAL_DATABASE_URL is missing.')
  }

  const prisma = new PrismaClient()

  const rooms = await prisma.anonymousInquiryRoom.findMany({
    select: {
      id: true,
      roomCode: true,
      accessCode: true,
    },
  })

  let migrated = 0
  let skipped = 0

  for (const room of rooms) {
    if (!room.accessCode || HASH_PATTERN.test(room.accessCode)) {
      skipped += 1
      continue
    }

    await prisma.anonymousInquiryRoom.update({
      where: { id: room.id },
      data: {
        accessCode: hashToken(room.accessCode),
      },
    })

    migrated += 1
    console.log(`[migrated] ${room.roomCode}`)
  }

  await prisma.$disconnect()

  console.log('')
  console.log(`Migration complete. migrated=${migrated}, skipped=${skipped}`)
}

main().catch((error) => {
  console.error('Anonymous inquiry access migration failed:', error)
  process.exitCode = 1
})
