import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'
import { parseStoredMaterialLocation } from '@/lib/lab-meeting-material-security'
import { verifyOnlyOfficeCallbackToken } from '@/lib/onlyoffice'

export const dynamic = 'force-dynamic'

interface OnlyOfficeCallbackPayload {
  status?: number
  url?: string
  token?: string
}

function extractBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization')?.trim() ?? ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() ?? ''
}

function shouldPersistCallback(payload: OnlyOfficeCallbackPayload) {
  return (payload.status === 2 || payload.status === 6) && typeof payload.url === 'string'
}

async function persistOnlyOfficeMaterial(materialId: string, documentUrl: string) {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: {
      id: true,
      url: true,
      mimeType: true,
    },
  })

  if (!material) {
    throw new Error(`Material not found: ${materialId}`)
  }

  const location = parseStoredMaterialLocation(material.url)

  if (!location) {
    throw new Error(`Stored location could not be parsed for material: ${materialId}`)
  }

  const response = await fetch(documentUrl, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`ONLYOFFICE document fetch failed with status ${response.status}`)
  }

  const fileBuffer = Buffer.from(await response.arrayBuffer())
  const { error } = await supabaseAdmin.storage.from(location.bucket).upload(location.path, fileBuffer, {
    upsert: true,
    contentType: material.mimeType || undefined,
  })

  if (error) {
    throw error
  }

  await prisma.material.update({
    where: { id: materialId },
    data: {
      updatedAt: new Date(),
    },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ materialId: string }> }
) {
  const { materialId } = await params

  try {
    const payload = (await request.json().catch(() => null)) as OnlyOfficeCallbackPayload | null
    const callbackToken =
      extractBearerToken(request) ||
      (typeof payload?.token === 'string' ? payload.token.trim() : '')
    const isAuthorized = await verifyOnlyOfficeCallbackToken(callbackToken, materialId)

    if (!isAuthorized) {
      console.warn('[ONLYOFFICE callback rejected]', {
        materialId,
        hasAuthorizationHeader: Boolean(request.headers.get('authorization')),
        hasBodyToken: typeof payload?.token === 'string',
      })

      return NextResponse.json({ error: 1 }, { status: 401 })
    }

    if (payload && shouldPersistCallback(payload)) {
      await persistOnlyOfficeMaterial(materialId, payload.url as string)
    }

    console.log('[ONLYOFFICE callback]', {
      materialId,
      status: payload?.status ?? null,
      persisted: Boolean(payload && shouldPersistCallback(payload)),
    })

    return NextResponse.json({ error: 0 })
  } catch (error) {
    console.error('[ONLYOFFICE callback error]', materialId, error)
    return NextResponse.json({ error: 1 }, { status: 500 })
  }
}
