import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  createSupabaseObjectUrl,
  parseStoredMaterialLocation,
  verifyLabMeetingMaterialAccessToken,
} from '@/lib/lab-meeting-material-security'

export const dynamic = 'force-dynamic'

async function getAuthorizedMaterial(materialId: string, request: NextRequest) {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      url: true,
      labMeetingId: true,
      partitionId: true,
    },
  })

  if (!material || (!material.labMeetingId && !material.partitionId)) {
    return { error: NextResponse.json({ error: 'Material not found' }, { status: 404 }), material: null }
  }

  const session = await auth()

  if (session?.user?.isApproved || session?.user?.isAdmin) {
    return { error: null, material }
  }

  const token = request.nextUrl.searchParams.get('token') || ''
  const isValidToken = await verifyLabMeetingMaterialAccessToken(token, materialId)

  if (!isValidToken) {
    const status = session?.user ? 403 : 401
    const message = session?.user ? 'Forbidden' : 'Unauthorized'
    return { error: NextResponse.json({ error: message }, { status }), material: null }
  }

  return { error: null, material }
}

async function fetchMaterialResponse(materialId: string, request: NextRequest, method: 'GET' | 'HEAD') {
  const { error, material } = await getAuthorizedMaterial(materialId, request)

  if (error || !material) {
    return error
  }

  const location = parseStoredMaterialLocation(material.url)

  if (!location) {
    return NextResponse.json({ error: 'Stored file location is invalid' }, { status: 500 })
  }

  const sourceUrl = await createSupabaseObjectUrl(location, 60)
  const rangeHeader = request.headers.get('range')
  const upstreamResponse = await fetch(sourceUrl, {
    method,
    headers: rangeHeader ? { range: rangeHeader } : undefined,
    cache: 'no-store',
  })

  if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: upstreamResponse.status })
  }

  const responseHeaders = new Headers()
  const contentType = upstreamResponse.headers.get('content-type') || material.mimeType || 'application/octet-stream'
  const contentLength = upstreamResponse.headers.get('content-length')
  const contentRange = upstreamResponse.headers.get('content-range')
  const acceptRanges = upstreamResponse.headers.get('accept-ranges')

  responseHeaders.set('Content-Type', contentType)
  responseHeaders.set('Cache-Control', 'private, no-store')
  responseHeaders.set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(material.filename)}`)

  if (contentLength) {
    responseHeaders.set('Content-Length', contentLength)
  }

  if (contentRange) {
    responseHeaders.set('Content-Range', contentRange)
  }

  if (acceptRanges) {
    responseHeaders.set('Accept-Ranges', acceptRanges)
  }

  if (method === 'HEAD') {
    return new NextResponse(null, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    })
  }

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  })
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return fetchMaterialResponse(id, request, 'HEAD')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return fetchMaterialResponse(id, request, 'GET')
}
