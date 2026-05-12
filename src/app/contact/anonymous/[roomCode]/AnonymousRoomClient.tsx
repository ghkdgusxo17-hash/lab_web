'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Copy, KeyRound, MessageCircleMore, RefreshCcw, Send, ShieldCheck } from 'lucide-react'
import {
  markAnonymousInquiryRoomReadByVisitor,
  sendAnonymousInquiryMessage,
} from '@/actions/contact'
import {
  buildAnonymousInquiryEntryCode,
  parseAnonymousInquiryConnectInput,
} from '@/lib/anonymous-inquiry-entry'

interface RoomMessage {
  id: string
  senderType: string
  content: string
  createdAt: string
}

interface AnonymousRoomData {
  id: string
  roomCode: string
  nickname: string | null
  category: string
  topic: string | null
  includeTestResult: boolean
  testResultTitle: string | null
  testResultSummary: string | null
  testTopAxes: string[]
  testFitScore: number | null
  status: string
  createdAt: string
  messages: RoomMessage[]
}

const VISITOR_KEY = 'cpeLabAnonymousVisitorKey'
const ACCESS_TOKEN_KEY_PREFIX = 'cpeLabAnonymousAccessToken:'
const LEGACY_SECRET_LINK_KEY_PREFIX = 'cpeLabAnonymousSecretLink:'

function formatDate(value: string) {
  return new Date(value).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getAccessTokenStorageKey(roomCode: string) {
  return `${ACCESS_TOKEN_KEY_PREFIX}${roomCode.toUpperCase()}`
}

function getLegacySecretLinkStorageKey(roomCode: string) {
  return `${LEGACY_SECRET_LINK_KEY_PREFIX}${roomCode.toUpperCase()}`
}

function readStoredAccessToken(roomCode: string) {
  const savedToken = localStorage.getItem(getAccessTokenStorageKey(roomCode))
  if (savedToken) {
    return savedToken
  }

  const legacySecretLink = localStorage.getItem(getLegacySecretLinkStorageKey(roomCode))
  if (!legacySecretLink) {
    return ''
  }

  const parsed = parseAnonymousInquiryConnectInput(legacySecretLink)
  return parsed?.accessToken ?? ''
}

export function AnonymousRoomClient({ room }: { room: AnonymousRoomData }) {
  const router = useRouter()
  const [messages, setMessages] = useState(room.messages)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [visitorKey, setVisitorKey] = useState('')
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [entryPassword, setEntryPassword] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setMessages(room.messages)
  }, [room.messages])

  useEffect(() => {
    const savedVisitorKey = localStorage.getItem(VISITOR_KEY)
    if (savedVisitorKey) {
      setVisitorKey(savedVisitorKey)
    }

    const accessToken = readStoredAccessToken(room.roomCode)
    if (accessToken) {
      localStorage.setItem(getAccessTokenStorageKey(room.roomCode), accessToken)
      setEntryPassword(buildAnonymousInquiryEntryCode(room.roomCode, accessToken))
    }
  }, [room.roomCode])

  useEffect(() => {
    void markAnonymousInquiryRoomReadByVisitor(room.roomCode)
  }, [room.roomCode])

  async function handleCopyEntryPassword() {
    if (!entryPassword) {
      setError('이 브라우저에 저장된 입장 비밀번호가 없어요. 처음 받은 비밀번호를 다시 확인해 주세요.')
      return
    }

    try {
      await navigator.clipboard.writeText(entryPassword)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('입장 비밀번호를 복사하지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      return
    }

    setError('')
    setSending(true)
    const result = await sendAnonymousInquiryMessage(room.roomCode, trimmedMessage, visitorKey)
    setSending(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.message) {
      setMessages((current) => [...current, result.message])
      setMessage('')
      startTransition(() => {
        router.refresh()
      })
    }
  }

  const hasAdminReply = messages.some((item) => item.senderType === 'ADMIN')

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/contact/anonymous"
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
            익명 문의 페이지로 돌아가기
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            익명 문의방
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            이 방에서는 관리자가 1:1로 메시지를 이어갑니다. 주소 전체보다 아래 입장 비밀번호 하나만
            저장해두는 쪽이 더 편하게 다시 들어올 수 있어요.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.refresh()}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <RefreshCcw className="h-4 w-4" />
          답변 확인
        </button>
      </div>

      <section className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6 dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-950 dark:to-cyan-950/20 md:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/70 bg-white/90 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 md:col-span-3">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">입장 비밀번호</p>
                </div>
                {entryPassword ? (
                  <>
                    <p className="mt-3 break-all text-base font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
                      {entryPassword}
                    </p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      이 비밀번호 하나만 저장해두면 같은 문의방으로 다시 들어올 수 있어요.
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    이 브라우저에 저장된 입장 비밀번호가 아직 없어요. 처음 전달받은 비밀번호를 따로 저장해두는 것을 추천합니다.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopyEntryPassword}
                disabled={!entryPassword}
                className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? '복사됨' : '입장 비밀번호 복사'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">문의 주제</p>
            <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{room.category}</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">현재 상태</p>
            <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
              {hasAdminReply ? '답변 확인 가능' : '관리자 확인 중'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">다시 들어오는 방법</p>
            <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">입장 비밀번호 입력</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
            {room.nickname || '익명 사용자'}
          </span>
          {room.topic && (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
              {room.topic}
            </span>
          )}
        </div>
      </section>

      {room.includeTestResult && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">첨부된 테스트 결과</h2>
          </div>
          <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{room.testResultTitle}</p>
          <p className="mt-2 text-slate-600 dark:text-slate-300">{room.testResultSummary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {room.testFitScore !== null && (
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                성장 궁합도 {room.testFitScore}%
              </span>
            )}
            {room.testTopAxes.map((axis) => (
              <span
                key={axis}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {axis}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <MessageCircleMore className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">대화 내역</h2>
          </div>
        </div>

        <div className="space-y-4 px-4 py-6 md:px-6">
          {messages.map((item) => {
            const isAdmin = item.senderType === 'ADMIN'

            return (
              <div key={item.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                <div className={`flex max-w-[85%] flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                  <span className="mb-1 px-1 text-xs font-semibold text-slate-400">
                    {isAdmin ? 'CPE Lab 답변' : '나'}
                  </span>
                  <div
                    className={`rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      isAdmin
                        ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                        : 'bg-cyan-600 text-white'
                    }`}
                  >
                    {item.content}
                  </div>
                  <span className="mt-1 px-1 text-xs text-slate-400">{formatDate(item.createdAt)}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="border-t border-slate-200 px-4 py-5 dark:border-slate-800 md:px-6">
          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-relaxed text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            이 방의 메시지는 안전한 운영을 위해 접속 IP와 브라우저 정보가 관리자 확인용으로 기록됩니다. 욕설,
            비방, 인신공격, 허위사실 유포가 확인되면 이용 제한 또는 관련 법적 조치가 취해질 수 있습니다.
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="추가로 궁금한 점이 있으면 이어서 적어 보세요."
            />
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                이 문의방은 익명 상태를 유지한 채 대화를 이어갈 수 있도록 설계되어 있어요.
              </p>
              <button
                type="submit"
                disabled={sending || isPending}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                <Send className="h-4 w-4" />
                {sending || isPending ? '보내는 중...' : '메시지 보내기'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
