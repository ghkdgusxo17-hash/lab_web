'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { isRateLimited } from '@/lib/rate-limit'
import { getAnonymousInquiryModerationError } from '@/lib/anonymous-inquiry-moderation'
import { getClientRequestMetadata, getRequestRateLimitKey } from '@/lib/request-rate-limit'
import {
  createAnonymousInquiryAccessToken,
  getAnonymousInquiryAccessCookieName,
  getAnonymousInquiryConnectPath,
  hashAnonymousInquiryAccessToken,
  isAnonymousInquiryAccessTokenValid,
  normalizeAnonymousInquiryRoomCode,
} from '@/lib/anonymous-inquiry-access'

const ANONYMOUS_CATEGORIES = ['랩실 생활', '연구 주제', '대학원 고민', '취업/진로'] as const

interface TestResultSnapshot {
  title: string
  summary: string
  fitScore: number
  topAxes: string[]
}

function normalizeText(value: FormDataEntryValue | string | null | undefined) {
  return String(value ?? '').trim()
}

function serializeDate(value: Date | null) {
  return value ? value.toISOString() : null
}

function randomCode(length: number, alphabet: string) {
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

async function generateUniqueRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const roomCode = `CPE-${randomCode(6, alphabet)}`
    const existingRoom = await prisma.anonymousInquiryRoom.findUnique({
      where: { roomCode },
      select: { id: true },
    })

    if (!existingRoom) {
      return roomCode
    }
  }

  throw new Error('방 코드를 생성하지 못했습니다.')
}

function parseTestResultSnapshot(raw: string) {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TestResultSnapshot>

    if (
      typeof parsed.title !== 'string' ||
      typeof parsed.summary !== 'string' ||
      typeof parsed.fitScore !== 'number' ||
      !Array.isArray(parsed.topAxes)
    ) {
      return null
    }

    return {
      title: parsed.title.trim().slice(0, 120),
      summary: parsed.summary.trim().slice(0, 500),
      fitScore: Math.max(0, Math.min(100, Math.round(parsed.fitScore))),
      topAxes: parsed.topAxes
        .filter((axis): axis is string => typeof axis === 'string')
        .map((axis) => axis.trim())
        .filter(Boolean)
        .slice(0, 3),
    }
  } catch {
    return null
  }
}

function serializeAnonymousRoom(room: {
  id: string
  roomCode: string
  nickname: string | null
  category: string
  topic: string | null
  includeTestResult: boolean
  testResultTitle: string | null
  testResultSummary: string | null
  testTopAxes: string | null
  testFitScore: number | null
  status: string
  lastMessageAt: Date
  lastAdminReadAt: Date | null
  lastVisitorReadAt: Date | null
  createdAt: Date
  updatedAt: Date
  messages: {
    id: string
    senderType: string
    content: string
    createdAt: Date
  }[]
}) {
  return {
    ...room,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
    lastMessageAt: room.lastMessageAt.toISOString(),
    lastAdminReadAt: serializeDate(room.lastAdminReadAt),
    lastVisitorReadAt: serializeDate(room.lastVisitorReadAt),
    messages: room.messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    })),
  }
}

async function getAuthorizedAnonymousInquiryRoomForVisitor(roomCode: string) {
  const normalizedRoomCode = normalizeAnonymousInquiryRoomCode(roomCode)
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(getAnonymousInquiryAccessCookieName(normalizedRoomCode))?.value ?? ''
  const room = await prisma.anonymousInquiryRoom.findUnique({
    where: { roomCode: normalizedRoomCode },
    select: { id: true, roomCode: true, accessCode: true },
  })

  if (!room || !isAnonymousInquiryAccessTokenValid(room.accessCode, accessToken)) {
    return null
  }

  return room
}

export async function submitInquiry(formData: FormData) {
  const name = normalizeText(formData.get('name'))
  const email = normalizeText(formData.get('email'))
  const subject = normalizeText(formData.get('subject'))
  const message = normalizeText(formData.get('message'))

  if (!name || !email || !subject || !message) {
    return { error: '모든 항목을 입력해 주세요.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: '유효한 이메일 주소를 입력해 주세요.' }
  }

  const contactClientKey = await getRequestRateLimitKey('contact-client', email)

  if (isRateLimited(contactClientKey, { maxRequests: 3, windowMs: 10 * 60 * 1000 })) {
    return { error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' }
  }

  await prisma.contactInquiry.create({
    data: {
      name,
      email,
      subject,
      message,
    },
  })

  revalidatePath('/admin/inquiries')
  return { success: true }
}

export async function createAnonymousInquiryRoom(formData: FormData) {
  const nickname = normalizeText(formData.get('nickname'))
  const category = normalizeText(formData.get('category'))
  const topic = normalizeText(formData.get('topic'))
  const message = normalizeText(formData.get('message'))
  const visitorKey = normalizeText(formData.get('visitorKey'))
  const includeTestResult = formData.get('includeTestResult') === 'true'
  const policyAccepted =
    formData.get('acknowledgePolicy') === 'true' || formData.get('acknowledgePolicy') === 'on'
  const rawSnapshot = normalizeText(formData.get('testResultSnapshot'))

  if (!category || !ANONYMOUS_CATEGORIES.includes(category as (typeof ANONYMOUS_CATEGORIES)[number])) {
    return { error: '문의 카테고리를 선택해 주세요.' }
  }

  if (!message) {
    return { error: '문의 내용을 입력해 주세요.' }
  }

  if (message.length < 8) {
    return { error: '조금만 더 자세히 적어주시면 답변드리기 쉬워요.' }
  }

  if (!policyAccepted) {
    return { error: '안내 문구를 확인하고 동의해 주세요.' }
  }

  const nicknameModerationError = nickname ? getAnonymousInquiryModerationError(nickname) : null
  if (nicknameModerationError) {
    return { error: nicknameModerationError }
  }

  const topicModerationError = topic ? getAnonymousInquiryModerationError(topic) : null
  if (topicModerationError) {
    return { error: topicModerationError }
  }

  const messageModerationError = getAnonymousInquiryModerationError(message)
  if (messageModerationError) {
    return { error: messageModerationError }
  }

  const anonymousCreateKey = await getRequestRateLimitKey(
    'anonymous-room-create',
    `${visitorKey}:${category}`
  )

  if (isRateLimited(anonymousCreateKey, { maxRequests: 3, windowMs: 10 * 60 * 1000 })) {
    return { error: '짧은 시간에 너무 많은 문의방을 만들고 있어요. 잠시 후 다시 시도해 주세요.' }
  }

  const roomCode = await generateUniqueRoomCode()
  const accessToken = createAnonymousInquiryAccessToken()
  const snapshot = includeTestResult ? parseTestResultSnapshot(rawSnapshot) : null
  const now = new Date()
  const requestMetadata = await getClientRequestMetadata()

  await prisma.anonymousInquiryRoom.create({
    data: {
      roomCode,
      accessCode: hashAnonymousInquiryAccessToken(accessToken),
      nickname: nickname || '익명 학부생',
      category,
      topic: topic || null,
      includeTestResult: Boolean(snapshot),
      testResultTitle: snapshot?.title ?? null,
      testResultSummary: snapshot?.summary ?? null,
      testTopAxes: snapshot ? JSON.stringify(snapshot.topAxes) : null,
      testFitScore: snapshot?.fitScore ?? null,
      policyAcceptedAt: now,
      createdIpAddress: requestMetadata.ipAddress,
      createdIpMasked: requestMetadata.ipMasked,
      createdUserAgent: requestMetadata.userAgent,
      lastVisitorIpAddress: requestMetadata.ipAddress,
      lastVisitorIpMasked: requestMetadata.ipMasked,
      lastVisitorUserAgent: requestMetadata.userAgent,
      status: 'OPEN',
      lastMessageAt: now,
      lastVisitorReadAt: now,
      messages: {
        create: {
          senderType: 'VISITOR',
          content: message,
          senderIpAddress: requestMetadata.ipAddress,
          senderIpMasked: requestMetadata.ipMasked,
          senderUserAgent: requestMetadata.userAgent,
        },
      },
    },
  })

  revalidatePath('/admin/inquiries')

  return {
    success: true,
    roomCode,
    accessToken,
    redirectTo: getAnonymousInquiryConnectPath(roomCode, accessToken),
  }
}

export async function sendAnonymousInquiryMessage(
  roomCode: string,
  content: string,
  visitorKey: string
) {
  const trimmedRoomCode = normalizeAnonymousInquiryRoomCode(roomCode)
  const trimmedContent = normalizeText(content)

  if (!trimmedContent) {
    return { error: '메시지를 입력해 주세요.' }
  }

  const moderationError = getAnonymousInquiryModerationError(trimmedContent)
  if (moderationError) {
    return { error: moderationError }
  }

  const anonymousMessageKey = await getRequestRateLimitKey(
    'anonymous-room-message',
    `${visitorKey}:${trimmedRoomCode}`
  )

  if (isRateLimited(anonymousMessageKey, { maxRequests: 8, windowMs: 60 * 1000 })) {
    return { error: '메시지를 너무 빠르게 보내고 있어요. 잠시 후 다시 시도해 주세요.' }
  }

  const room = await getAuthorizedAnonymousInquiryRoomForVisitor(trimmedRoomCode)

  if (!room) {
    return { error: '입장 비밀번호가 유효하지 않거나 만료되었습니다.' }
  }

  const now = new Date()
  const requestMetadata = await getClientRequestMetadata()
  const message = await prisma.$transaction(async (tx) => {
    const createdMessage = await tx.anonymousInquiryMessage.create({
      data: {
        roomId: room.id,
        senderType: 'VISITOR',
        content: trimmedContent,
        senderIpAddress: requestMetadata.ipAddress,
        senderIpMasked: requestMetadata.ipMasked,
        senderUserAgent: requestMetadata.userAgent,
      },
    })

    await tx.anonymousInquiryRoom.update({
      where: { id: room.id },
      data: {
        status: 'OPEN',
        lastMessageAt: now,
        lastVisitorReadAt: now,
        lastVisitorIpAddress: requestMetadata.ipAddress,
        lastVisitorIpMasked: requestMetadata.ipMasked,
        lastVisitorUserAgent: requestMetadata.userAgent,
      },
    })

    return createdMessage
  })

  revalidatePath('/admin/inquiries')
  revalidatePath(`/contact/anonymous/${trimmedRoomCode}`)

  return {
    success: true,
    message: {
      ...message,
      createdAt: message.createdAt.toISOString(),
    },
  }
}

export async function replyToAnonymousInquiryRoom(roomId: string, content: string) {
  const session = await auth()

  if (!session?.user?.isAdmin) {
    return { error: '권한이 없습니다.' }
  }

  const trimmedRoomId = normalizeText(roomId)
  const trimmedContent = normalizeText(content)

  if (!trimmedContent) {
    return { error: '답변 내용을 입력해 주세요.' }
  }

  const room = await prisma.anonymousInquiryRoom.findUnique({
    where: { id: trimmedRoomId },
    select: { id: true, roomCode: true },
  })

  if (!room) {
    return { error: '문의방을 찾을 수 없습니다.' }
  }

  const now = new Date()
  await prisma.$transaction(async (tx) => {
    await tx.anonymousInquiryMessage.create({
      data: {
        roomId: room.id,
        senderType: 'ADMIN',
        content: trimmedContent,
      },
    })

    await tx.anonymousInquiryRoom.update({
      where: { id: room.id },
      data: {
        status: 'ANSWERED',
        lastMessageAt: now,
        lastAdminReadAt: now,
      },
    })
  })

  revalidatePath('/admin/inquiries')
  revalidatePath(`/contact/anonymous/${room.roomCode}`)

  return { success: true }
}

export async function getInquiries() {
  const session = await auth()

  if (!session?.user?.isAdmin) {
    return { error: '권한이 없습니다.' }
  }

  const inquiries = await prisma.contactInquiry.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return { inquiries }
}

export async function getAnonymousInquiryRooms() {
  const session = await auth()

  if (!session?.user?.isAdmin) {
    return { error: '권한이 없습니다.' }
  }

  const rooms = await prisma.anonymousInquiryRoom.findMany({
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  })

  return {
    rooms: rooms.map(serializeAnonymousRoom),
  }
}

export async function markInquiryAsRead(id: string) {
  const session = await auth()

  if (!session?.user?.isAdmin) {
    return { error: '권한이 없습니다.' }
  }

  await prisma.contactInquiry.update({
    where: { id },
    data: { isRead: true },
  })

  revalidatePath('/admin/inquiries')
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteInquiry(id: string) {
  const session = await auth()

  if (!session?.user?.isAdmin) {
    return { error: '권한이 없습니다.' }
  }

  await prisma.contactInquiry.delete({
    where: { id },
  })

  revalidatePath('/admin/inquiries')
  revalidatePath('/admin')
  return { success: true }
}

export async function markAnonymousInquiryRoomReadByAdmin(roomId: string) {
  const session = await auth()

  if (!session?.user?.isAdmin) {
    return { error: '권한이 없습니다.' }
  }

  await prisma.anonymousInquiryRoom.update({
    where: { id: roomId },
    data: { lastAdminReadAt: new Date() },
  })

  revalidatePath('/admin/inquiries')
  return { success: true }
}

export async function markAnonymousInquiryRoomReadByVisitor(roomCode: string) {
  const trimmedRoomCode = normalizeAnonymousInquiryRoomCode(roomCode)
  const room = await getAuthorizedAnonymousInquiryRoomForVisitor(trimmedRoomCode)

  if (!room) {
    return { error: '입장 비밀번호가 유효하지 않거나 만료되었습니다.' }
  }

  await prisma.anonymousInquiryRoom.update({
    where: { id: room.id },
    data: { lastVisitorReadAt: new Date() },
  })

  revalidatePath(`/contact/anonymous/${trimmedRoomCode}`)
  return { success: true }
}

export async function getUnreadInquiryCount() {
  const session = await auth()

  if (!session?.user?.isAdmin) {
    return 0
  }

  const count = await prisma.contactInquiry.count({
    where: { isRead: false },
  })

  return count
}
