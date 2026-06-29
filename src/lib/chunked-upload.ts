// 브라우저에서 파일을 조각내어 업로드하는 클라이언트 헬퍼.
// 조각마다 작은 요청이라 Cloudflare 무료 플랜의 100MB/약 100초 제한에 걸리지 않고,
// 중간에 한 조각이 실패해도 그 조각만 다시 보낸다.

const DEFAULT_CHUNK_SIZE = 6 * 1024 * 1024 // 6MB
const MAX_CHUNK_RETRIES = 4

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({} as Record<string, unknown>))
  return { res, data: data as Record<string, any> }
}

// 파일 하나를 조각내어 endpoint(?step=init / ?step=chunk)로 올리고 uploadId를 반환한다.
// onOffset(currentBytes)로 이 파일의 누적 전송 바이트를 알려준다(진행률 계산용).
async function stageFileInChunks(
  file: File,
  endpoint: string,
  onOffset: (currentBytes: number) => void,
  initExtra: Record<string, unknown> = {}
): Promise<string> {
  const { res: initRes, data: initData } = await postJson(`${endpoint}?step=init`, {
    ...initExtra,
    filename: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
  })

  if (!initRes.ok) {
    throw new Error(initData.error || '업로드를 시작하지 못했습니다.')
  }

  const uploadId = initData.uploadId as string
  const chunkSize = (initData.chunkSize as number) || DEFAULT_CHUNK_SIZE

  let offset = 0
  let safety = 0

  while (offset < file.size) {
    const end = Math.min(offset + chunkSize, file.size)
    const chunk = file.slice(offset, end)

    let attempt = 0
    let advanced = false

    while (!advanced) {
      try {
        const res = await fetch(`${endpoint}?step=chunk`, {
          method: 'POST',
          headers: {
            'content-type': 'application/octet-stream',
            'x-upload-id': uploadId,
            'x-offset': String(offset),
          },
          body: chunk,
        })

        if (res.ok) {
          const data = await res.json().catch(() => ({}))
          offset = typeof data.offset === 'number' ? data.offset : end
          advanced = true
        } else if (res.status === 409) {
          const data = await res.json().catch(() => ({}))
          if (typeof data.expected === 'number') {
            offset = data.expected
          }
          advanced = true
        } else {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.error || `조각 전송 실패 (HTTP ${res.status})`)
        }
      } catch (err) {
        attempt++
        if (attempt >= MAX_CHUNK_RETRIES) {
          throw err instanceof Error
            ? err
            : new Error('파일 조각 전송에 실패했습니다. 네트워크를 확인해 주세요.')
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }

    onOffset(offset)

    safety++
    if (safety > 100000) {
      throw new Error('업로드가 비정상적으로 반복됩니다. 새로고침 후 다시 시도해 주세요.')
    }
  }

  return uploadId
}

// ── 파티션 자료 업로드 ───────────────────────────────────────────────
export interface ChunkedUploadParams {
  file: File
  partitionId: string
  title: string
  description: string
  onProgress?: (percent: number) => void
}

export async function uploadFileInChunks({
  file,
  partitionId,
  title,
  description,
  onProgress,
}: ChunkedUploadParams) {
  const endpoint = '/api/partition-upload'
  const total = file.size || 1

  const uploadId = await stageFileInChunks(
    file,
    endpoint,
    (current) => onProgress?.(Math.min(99, Math.round((current / total) * 100))),
    { partitionId }
  )

  const { res, data } = await postJson(`${endpoint}?step=complete`, { uploadId, title, description })
  if (!res.ok) {
    throw new Error(data.error || '업로드 완료 처리에 실패했습니다.')
  }
  onProgress?.(100)
  return data
}

// ── 랩미팅 발표자료 업로드 (메인 + 참고자료 여러 개) ──────────────────
export interface LabMeetingUploadParams {
  labMeetingId: string
  file: File
  referenceFiles?: File[]
  title: string
  description: string
  category: string
  presenterId: string
  onProgress?: (percent: number) => void
}

export async function uploadLabMeetingMaterialChunked({
  labMeetingId,
  file,
  referenceFiles = [],
  title,
  description,
  category,
  presenterId,
  onProgress,
}: LabMeetingUploadParams) {
  const endpoint = '/api/lab-meeting-upload'
  const totalBytes = [file, ...referenceFiles].reduce((sum, f) => sum + f.size, 0) || 1
  let baseSent = 0

  async function stage(f: File): Promise<string> {
    const uploadId = await stageFileInChunks(f, endpoint, (current) => {
      onProgress?.(Math.min(99, Math.round(((baseSent + current) / totalBytes) * 100)))
    })
    baseSent += f.size
    return uploadId
  }

  const mainUploadId = await stage(file)

  const referenceUploadIds: string[] = []
  for (const referenceFile of referenceFiles) {
    referenceUploadIds.push(await stage(referenceFile))
  }

  const { res, data } = await postJson(`${endpoint}?step=finalize`, {
    labMeetingId,
    mainUploadId,
    referenceUploadIds,
    title,
    description,
    category,
    presenterId,
  })

  if (!res.ok) {
    throw new Error(data.error || '업로드 완료 처리에 실패했습니다.')
  }

  onProgress?.(100)
  return data
}
