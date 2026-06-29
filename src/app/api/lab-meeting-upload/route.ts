import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'
import {
  LAB_MEETING_PRIVATE_BUCKET,
  buildSecureStorageUrl,
  ensureLabMeetingPrivateBucket,
} from '@/lib/lab-meeting-material-security'

export const dynamic = 'force-dynamic'

// 랩미팅 발표자료는 메인 파일 + 참고자료 여러 개를 한 번에 올린다.
// 각 파일을 조각내 보내(init/chunk) 서버 임시파일에 모은 뒤,
// finalize에서 한꺼번에 비공개 버킷에 저장하고 Material 레코드(메인 + 참고자료)를 만든다.
// 조각 요청이 작아 Cloudflare 100MB/약 100초 제한에 걸리지 않는다. (DB 스키마 변경 없음)
const MAX_SIZE = 100 * 1024 * 1024 // 파일당 100MB
const TMP_DIR = path.join(os.tmpdir(), 'labweb-uploads')
const SESSION_TTL_MS = 60 * 60 * 1000

interface UploadSession {
  uploaderId: string
  filename: string
  size: number
  mimeType: string
  tmpPath: string
  received: number
  createdAt: number
}

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

async function storeBufferToPrivate(buffer: Buffer, originalFilename: string, mimeType: string) {
  const safeName = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storageName = `${randomUUID()}_${safeName}`
  const filePath = `lab-meeting/${storageName}`

  const { error } = await supabaseAdmin.storage
    .from(LAB_MEETING_PRIVATE_BUCKET)
    .upload(filePath, buffer, { contentType: mimeType, upsert: false })

  if (error) {
    console.error('Supabase upload error:', error)
    throw new Error('파일 저장 중 오류가 발생했습니다.')
  }

  return {
    title: originalFilename.replace(/\.[^/.]+$/, ''),
    filename: originalFilename,
    url: buildSecureStorageUrl(LAB_MEETING_PRIVATE_BUCKET, filePath),
    size: buffer.byteLength,
    mimeType,
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
  const filename = typeof body?.filename === 'string' ? body.filename : ''
  const size = Number(body?.size)
  const mimeType = typeof body?.mimeType === 'string' ? body.mimeType : 'application/octet-stream'

  if (!filename || !Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: '업로드 정보가 올바르지 않습니다.' }, { status: 400 })
  }

  if (size > MAX_SIZE) {
    return NextResponse.json({ error: '파일 크기는 최대 100MB까지 가능합니다.' }, { status: 413 })
  }

  await sweepStaleSessions()
  await fs.mkdir(TMP_DIR, { recursive: true })

  const uploadId = randomUUID()
  const tmpPath = path.join(TMP_DIR, uploadId)
  await fs.writeFile(tmpPath, Buffer.alloc(0))

  uploads.set(uploadId, {
    uploaderId: session.user.id,
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

// 업로드 세션에서 검증된 버퍼를 읽어온다 (소유자 + 크기 일치 확인).
async function readVerifiedUpload(uploadId: string, userId: string) {
  const upload = uploads.get(uploadId)
  if (!upload) {
    throw new Error('업로드 세션을 찾을 수 없습니다. 다시 시도해 주세요.')
  }
  if (upload.uploaderId !== userId) {
    throw new Error('권한이 없습니다.')
  }
  if (upload.received !== upload.size) {
    throw new Error('업로드가 완료되지 않은 파일이 있습니다.')
  }
  const buffer = await fs.readFile(upload.tmpPath)
  if (buffer.byteLength !== upload.size) {
    throw new Error('파일 크기가 일치하지 않습니다. 다시 시도해 주세요.')
  }
  return { upload, buffer }
}

async function handleFinalize(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  if (!session.user.isApproved && !session.user.isAdmin) {
    return NextResponse.json({ error: '승인된 멤버만 자료를 업로드할 수 있습니다.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const labMeetingId = typeof body?.labMeetingId === 'string' ? body.labMeetingId : ''
  const mainUploadId = typeof body?.mainUploadId === 'string' ? body.mainUploadId : ''
  const referenceUploadIds: string[] = Array.isArray(body?.referenceUploadIds)
    ? body.referenceUploadIds.filter((id: unknown): id is string => typeof id === 'string')
    : []
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const description = typeof body?.description === 'string' ? body.description.trim() : ''
  const category = (typeof body?.category === 'string' ? body.category.trim() : '') || 'PPT'
  const presenterId = typeof body?.presenterId === 'string' ? body.presenterId.trim() : ''

  if (!labMeetingId || !mainUploadId || !title) {
    return NextResponse.json({ error: '제목과 발표자료 파일을 입력해주세요.' }, { status: 400 })
  }

  const labMeeting = await prisma.labMeeting.findUnique({
    where: { id: labMeetingId },
    select: { id: true },
  })

  if (!labMeeting) {
    return NextResponse.json({ error: '랩미팅을 찾을 수 없습니다.' }, { status: 404 })
  }

  let validPresenterId: string | null = null
  if (presenterId) {
    const presenter = await prisma.user.findFirst({
      where: { id: presenterId, isApproved: true },
      select: { id: true },
    })
    if (!presenter) {
      return NextResponse.json({ error: '발표자를 찾을 수 없습니다.' }, { status: 400 })
    }
    validPresenterId = presenter.id
  }

  const usedSessionIds: string[] = []

  try {
    const main = await readVerifiedUpload(mainUploadId, session.user.id)
    usedSessionIds.push(mainUploadId)

    const references: { buffer: Buffer; filename: string; mimeType: string }[] = []
    for (const refId of referenceUploadIds) {
      const ref = await readVerifiedUpload(refId, session.user.id)
      usedSessionIds.push(refId)
      references.push({ buffer: ref.buffer, filename: ref.upload.filename, mimeType: ref.upload.mimeType })
    }

    await ensureLabMeetingPrivateBucket()

    const uploadedMainFile = await storeBufferToPrivate(main.buffer, main.upload.filename, main.upload.mimeType)
    const uploadedReferenceFiles: Awaited<ReturnType<typeof storeBufferToPrivate>>[] = []
    for (const ref of references) {
      uploadedReferenceFiles.push(await storeBufferToPrivate(ref.buffer, ref.filename, ref.mimeType))
    }

    await prisma.$transaction(async (tx) => {
      const mainMaterial = await tx.material.create({
        data: {
          title,
          description: description || null,
          category,
          filename: uploadedMainFile.filename,
          url: uploadedMainFile.url,
          size: uploadedMainFile.size,
          mimeType: uploadedMainFile.mimeType,
          uploaderId: session.user.id,
          presenterId: validPresenterId,
          labMeetingId,
        },
      })

      if (uploadedReferenceFiles.length > 0) {
        await tx.material.createMany({
          data: uploadedReferenceFiles.map((referenceFile) => ({
            title: referenceFile.title,
            description: null,
            category: 'REFERENCE',
            filename: referenceFile.filename,
            url: referenceFile.url,
            size: referenceFile.size,
            mimeType: referenceFile.mimeType,
            uploaderId: session.user.id,
            presenterId: null,
            labMeetingId,
            parentMaterialId: mainMaterial.id,
          })) as any,
        })
      }
    })

    revalidatePath(`/materials/lab-meeting/${labMeetingId}`)
    revalidatePath('/materials/lab-meeting/presenters')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lab meeting finalize error:', error)
    const message = error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    // 성공/실패와 무관하게 사용한 임시 세션 정리
    for (const id of usedSessionIds) {
      const upload = uploads.get(id)
      if (upload) {
        uploads.delete(id)
        await fs.rm(upload.tmpPath, { force: true }).catch(() => {})
      }
    }
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

  if (step === 'finalize') {
    return handleFinalize(request)
  }

  return NextResponse.json({ error: '알 수 없는 업로드 단계입니다.' }, { status: 400 })
}
