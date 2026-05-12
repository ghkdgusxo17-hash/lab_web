import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/layout'
import { prisma } from '@/lib/prisma'
import {
  getAnonymousInquiryAccessCookieName,
  getAnonymousInquiryConnectPath,
  isAnonymousInquiryAccessTokenValid,
  normalizeAnonymousInquiryRoomCode,
} from '@/lib/anonymous-inquiry-access'
import { AnonymousRoomClient } from './AnonymousRoomClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '익명 문의방 | CPE Lab',
  description: '익명 문의방에서 관리자와 대화를 이어갈 수 있습니다.',
}

function parseTopAxes(value: string | null) {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

export default async function AnonymousInquiryRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomCode: string }>
  searchParams: Promise<{ token?: string; code?: string }>
}) {
  const { roomCode } = await params
  const query = await searchParams
  const normalizedRoomCode = normalizeAnonymousInquiryRoomCode(roomCode)
  const incomingToken = String(query.token ?? query.code ?? '').trim()

  if (incomingToken) {
    redirect(getAnonymousInquiryConnectPath(normalizedRoomCode, incomingToken))
  }

  const cookieStore = await cookies()
  const accessToken = cookieStore.get(getAnonymousInquiryAccessCookieName(normalizedRoomCode))?.value ?? ''
  const room = accessToken
    ? await prisma.anonymousInquiryRoom.findUnique({
        where: { roomCode: normalizedRoomCode },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })
    : null

  const isInvalid = !room || !isAnonymousInquiryAccessTokenValid(room.accessCode, accessToken)

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-6 pb-20 pt-32">
        <div className="mx-auto max-w-6xl">
          {isInvalid ? (
            <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h1 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">
                익명 문의방에 들어갈 수 없어요
              </h1>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                입장 비밀번호가 유효하지 않거나 브라우저에 저장된 접근 정보가 없습니다.
                익명 문의 페이지에서 받은 비밀번호를 다시 입력해 주세요.
              </p>
              <Link
                href="/contact/anonymous"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white dark:bg-white dark:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                익명 문의 페이지로 돌아가기
              </Link>
            </section>
          ) : (
            <AnonymousRoomClient
              room={{
                id: room.id,
                roomCode: room.roomCode,
                nickname: room.nickname,
                category: room.category,
                topic: room.topic,
                includeTestResult: room.includeTestResult,
                testResultTitle: room.testResultTitle,
                testResultSummary: room.testResultSummary,
                testTopAxes: parseTopAxes(room.testTopAxes),
                testFitScore: room.testFitScore,
                status: room.status,
                createdAt: room.createdAt.toISOString(),
                messages: room.messages.map((message) => ({
                  id: message.id,
                  senderType: message.senderType,
                  content: message.content,
                  createdAt: message.createdAt.toISOString(),
                })),
              }}
            />
          )}
        </div>
      </main>
    </>
  )
}
