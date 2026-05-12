import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getAnonymousInquiryAccessCookieName,
  hashAnonymousInquiryAccessToken,
  isAnonymousInquiryAccessTokenValid,
  normalizeAnonymousInquiryAccessToken,
  normalizeAnonymousInquiryRoomCode,
} from '@/lib/anonymous-inquiry-access'

export const dynamic = 'force-dynamic'

function getRedirectOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = forwardedHost ?? request.headers.get('host')
  const forwardedProto = request.headers.get('x-forwarded-proto')

  if (!host) {
    const fallbackUrl = request.nextUrl.clone()
    if (fallbackUrl.hostname === 'localhost' || fallbackUrl.hostname === '127.0.0.1') {
      fallbackUrl.protocol = 'http:'
    }
    return fallbackUrl.origin
  }

  const normalizedHost = host.toLowerCase()
  const isLocalhost =
    normalizedHost.startsWith('localhost') || normalizedHost.startsWith('127.0.0.1')
  const protocol = isLocalhost ? 'http' : forwardedProto === 'http' || forwardedProto === 'https'
    ? forwardedProto
    : request.nextUrl.protocol.replace(':', '')

  return `${protocol}://${host}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params
  const normalizedRoomCode = normalizeAnonymousInquiryRoomCode(roomCode)
  const accessToken = normalizeAnonymousInquiryAccessToken(
    request.nextUrl.searchParams.get('token') ?? request.nextUrl.searchParams.get('code')
  )
  const roomPageUrl = new URL(`/contact/anonymous/${normalizedRoomCode}`, getRedirectOrigin(request))

  if (!accessToken) {
    return NextResponse.redirect(roomPageUrl)
  }

  const room = await prisma.anonymousInquiryRoom.findUnique({
    where: { roomCode: normalizedRoomCode },
    select: { id: true, accessCode: true },
  })

  if (!room || !isAnonymousInquiryAccessTokenValid(room.accessCode, accessToken)) {
    return NextResponse.redirect(roomPageUrl)
  }

  if (room.accessCode !== hashAnonymousInquiryAccessToken(accessToken)) {
    await prisma.anonymousInquiryRoom.update({
      where: { id: room.id },
      data: {
        accessCode: hashAnonymousInquiryAccessToken(accessToken),
      },
    })
  }

  const response = NextResponse.redirect(roomPageUrl)
  response.cookies.set({
    name: getAnonymousInquiryAccessCookieName(normalizedRoomCode),
    value: accessToken,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 180,
    path: '/',
  })

  return response
}
