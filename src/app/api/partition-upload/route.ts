import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getProxyUrl } from '@/lib/storage-constants'
import { uploadStorageObject } from '@/lib/storage-admin'

export const dynamic = 'force-dynamic'

// 큰 파일은 통째로 한 요청에 보내면 Cloudflare 무료 플랜의 100MB/약 100초 제한에 걸린다.
// 그래서 브라우저가 파일을 조각내 보내고, 서버가 임시 파일에 이어붙인 뒤
// 마지막에 한 번 Supabase에 올리고 Material 레코드를 만든다. (DB 스키마 변경 없음)
const MAX_SIZE = 100 * 1024 * 1024 // 100MB
const TMP_DIR = path.join(os.tmpdir(), 'labweb-uploads')
const SESSION_TTL_MS = 60 * 60 * 1000 // 1시간

interface UploadSession {
  uploaderId: string
  partitionId: string
  category: string
  filename: string
  size: number
  mimeType: string
  tmpPath: string
  received: number
  createdAt: number
}

// next start = 단일 프로세스라 모듈 레벨 Map으로 진행 중 업로드를 추적한다.
// (서버 재시작 시 진행 중이던 업로드는 사라지며, 클라이언트가 처음부터 재시도하면 된다.)
const uploads = new Map<string, UploadSession>()

async function sweepStaleSessions() {
  const now = Date.now()
  for (const [id, session] of uploads) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      uploads.delete(id)
      await fs.rm(session.tmpPath, { force: true }).catch(() => {})
    }
  }
}

async function handleInit(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  if (!session.user.isApproved && !session.user.isAdmin) {
    return NextResponse.json({ error: '승인된 멤버만 자료를 업로드할 수 있습니다.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const partitionId = typeof body?.partitionId === 'string' ? body.partitionId : ''
  const filename = typeof body?.filename === 'string' ? body.filename : ''
  const size = Number(body?.size)
  const mimeType = typeof body?.mimeType === 'string' ? body.mimeType : 'application/octet-stream'

  if (!partitionId || !filename || !Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: '업로드 정보가 올바르지 않습니다.' }, { status: 400 })
  }

  if (size > MAX_SIZE) {
    return NextResponse.json({ error: '파일 크기는 최대 100MB까지 가능합니다.' }, { status: 413 })
  }

  const partition = await prisma.materialPartition.findUnique({
    where: { id: partitionId },
    select: { id: true, category: true },
  })

  if (!partition) {
    return NextResponse.json({ error: '파티션을 찾을 수 없습니다.' }, { status: 404 })
  }

  await sweepStaleSessions()
  await fs.mkdir(TMP_DIR, { recursive: true })

  const uploadId = randomUUID()
  const tmpPath = path.join(TMP_DIR, uploadId)
  await fs.writeFile(tmpPath, Buffer.alloc(0))

  uploads.set(uploadId, {
    uploaderId: session.user.id,
    partitionId: partition.id,
    category: partition.category,
    filename,
    size,
    mimeType,
    tmpPath,
    received: 0,
    createdAt: Date.now(),
  })

  return NextResponse.json({ uploadId, chunkSize: 6 * 1024 * 1024 })
}

async function handleChunk(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const uploadId = request.headers.get('x-upload-id') || ''
  const offset = Number(request.headers.get('x-offset'))
  const upload = uploads.get(uploadId)

  if (!upload) {
    return NextResponse.json({ error: '업로드 세션을 찾을 수 없습니다. 다시 시도해 주세요.' }, { status: 404 })
  }

  if (upload.uploaderId !== session.user.id) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  // 클라이언트가 보낸 시작 위치가 서버가 받은 양과 다르면, 재시도/중복 방지를 위해
  // 서버가 기대하는 위치를 알려주고 클라이언트가 거기서부터 다시 보내게 한다.
  if (!Number.isFinite(offset) || offset !== upload.received) {
    return NextResponse.json({ error: 'offset mismatch', expected: upload.received }, { status: 409 })
  }

  const chunk = Buffer.from(await request.arrayBuffer())

  if (chunk.byteLength === 0) {
    return NextResponse.json({ error: '빈 조각입니다.' }, { status: 400 })
  }

  if (upload.received + chunk.byteLength > upload.size) {
    return NextResponse.json({ error: '전송된 데이터가 신고된 크기를 초과했습니다.' }, { status: 400 })
  }

  await fs.appendFile(upload.tmpPath, chunk)
  upload.received += chunk.byteLength

  return NextResponse.json({ offset: upload.received })
}

async function handleComplete(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const uploadId = typeof body?.uploadId === 'string' ? body.uploadId : ''
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const description = typeof body?.description === 'string' ? body.description : ''

  const upload = uploads.get(uploadId)

  if (!upload) {
    return NextResponse.json({ error: '업로드 세션을 찾을 수 없습니다. 다시 시도해 주세요.' }, { status: 404 })
  }

  if (upload.uploaderId !== session.user.id) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  if (!title) {
    return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 })
  }

  // 받은 바이트 수가 신고된 크기와 정확히 일치할 때만 저장 → 반쪽짜리 파일 방지
  if (upload.received !== upload.size) {
    return NextResponse.json(
      { error: `업로드가 완료되지 않았습니다. (${upload.received}/${upload.size} bytes)`, expected: upload.received },
      { status: 409 }
    )
  }

  try {
    const buffer = await fs.readFile(upload.tmpPath)

    if (buffer.byteLength !== upload.size) {
      return NextResponse.json({ error: '파일 크기가 일치하지 않습니다. 다시 시도해 주세요.' }, { status: 409 })
    }

    const timestamp = Date.now()
    const safeName = upload.filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storageName = `${timestamp}_${safeName}`
    const filePath = `materials/${storageName}`

    const { error: uploadError } = await uploadStorageObject(filePath, buffer, {
      contentType: upload.mimeType,
      upsert: true,
    })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: '파일 저장 중 오류가 발생했습니다.' }, { status: 500 })
    }

    const material = await prisma.material.create({
      data: {
        title,
        description: description || null,
        category: upload.category,
        filename: upload.filename,
        url: getProxyUrl(filePath),
        size: upload.size,
        mimeType: upload.mimeType,
        uploaderId: session.user.id,
        partitionId: upload.partitionId,
      },
      select: { id: true },
    })

    uploads.delete(uploadId)
    await fs.rm(upload.tmpPath, { force: true }).catch(() => {})

    revalidatePath(`/materials/partition/${upload.partitionId}`)
    revalidatePath('/materials')

    return NextResponse.json({ success: true, materialId: material.id })
  } catch (error) {
    console.error('Upload complete error:', error)
    return NextResponse.json({ error: '업로드 완료 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const step = request.nextUrl.searchParams.get('step')

  if (step === 'init') {
    return handleInit(request)
  }

  if (step === 'chunk') {
    return handleChunk(request)
  }

  if (step === 'complete') {
    return handleComplete(request)
  }

  return NextResponse.json({ error: '알 수 없는 업로드 단계입니다.' }, { status: 400 })
}
