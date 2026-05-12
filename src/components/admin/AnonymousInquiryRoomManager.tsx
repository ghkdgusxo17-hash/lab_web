'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
  MessageCircleMore,
  RefreshCcw,
  Send,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import {
  markAnonymousInquiryRoomReadByAdmin,
  replyToAnonymousInquiryRoom,
} from '@/actions/contact'

interface AnonymousRoomMessage {
  id: string
  senderType: string
  content: string
  createdAt: string
}

interface AnonymousRoom {
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
  policyAcceptedAt: string | null
  createdIpAddress: string | null
  createdIpMasked: string | null
  createdUserAgent: string | null
  lastVisitorIpAddress: string | null
  lastVisitorIpMasked: string | null
  lastVisitorUserAgent: string | null
  status: string
  lastMessageAt: string
  lastAdminReadAt: string | null
  lastVisitorReadAt: string | null
  createdAt: string
  messages: AnonymousRoomMessage[]
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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

function hasUnreadVisitorMessage(room: AnonymousRoom) {
  const latestVisitorMessage = [...room.messages]
    .reverse()
    .find((message) => message.senderType === 'VISITOR')

  if (!latestVisitorMessage) {
    return false
  }

  if (!room.lastAdminReadAt) {
    return true
  }

  return new Date(latestVisitorMessage.createdAt).getTime() > new Date(room.lastAdminReadAt).getTime()
}

export function AnonymousInquiryRoomManager({ rooms }: { rooms: AnonymousRoom[] }) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(rooms[0]?.id ?? null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  async function handleExpand(room: AnonymousRoom) {
    const nextExpanded = expandedId === room.id ? null : room.id
    setExpandedId(nextExpanded)

    if (nextExpanded === room.id && hasUnreadVisitorMessage(room)) {
      await markAnonymousInquiryRoomReadByAdmin(room.id)
      router.refresh()
    }
  }

  async function handleReply(roomId: string) {
    const content = drafts[roomId]?.trim()
    if (!content) {
      return
    }

    setSubmittingId(roomId)
    const result = await replyToAnonymousInquiryRoom(roomId, content)
    setSubmittingId(null)

    if (result.success) {
      setDrafts((current) => ({
        ...current,
        [roomId]: '',
      }))
      router.refresh()
    }
  }

  return (
    <div className="mb-10">
      <div className="mb-4 flex items-center gap-3 border-l-4 border-cyan-500 pl-3">
        <MessageCircleMore className="h-5 w-5 text-cyan-600" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">익명 문의방</h2>
        {rooms.some(hasUnreadVisitorMessage) && (
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
            새 메시지 {rooms.filter(hasUnreadVisitorMessage).length}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-xl shadow-slate-200/50 dark:border-cyan-900/30 dark:bg-slate-900 dark:shadow-none">
        {rooms.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            생성된 익명 문의방이 없습니다
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rooms.map((room) => {
              const isExpanded = expandedId === room.id
              const topAxes = parseTopAxes(room.testTopAxes)
              const unread = hasUnreadVisitorMessage(room)

              return (
                <div key={room.id} className={unread ? 'bg-cyan-50/40 dark:bg-cyan-950/10' : ''}>
                  <button
                    type="button"
                    onClick={() => handleExpand(room)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {room.category}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            room.status === 'OPEN'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          }`}
                        >
                          {room.status === 'OPEN' ? '답변 필요' : '답변 완료'}
                        </span>
                        {unread && (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-300">
                            새 메시지
                          </span>
                        )}
                      </div>

                      <p className="mt-3 truncate text-lg font-semibold text-slate-900 dark:text-white">
                        {room.topic || `${room.category} 문의`}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                        {room.nickname || '익명 사용자'} · {room.roomCode} · 최근 메시지 {formatDate(room.lastMessageAt)}
                      </p>
                    </div>

                    <div className="ml-4 flex items-center gap-3 text-slate-400">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-6 dark:border-slate-800 dark:bg-slate-950/30">
                      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <span>방 코드 {room.roomCode}</span>
                              <span>·</span>
                              <span>입장 비밀번호 방식</span>
                              <span>·</span>
                              <span>생성 {formatDate(room.createdAt)}</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {room.messages.map((message) => {
                              const isAdmin = message.senderType === 'ADMIN'

                              return (
                                <div
                                  key={message.id}
                                  className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`flex max-w-[85%] flex-col ${
                                      isAdmin ? 'items-end' : 'items-start'
                                    }`}
                                  >
                                    <span className="mb-1 px-1 text-xs font-semibold text-slate-400">
                                      {isAdmin ? '관리자' : room.nickname || '익명 사용자'}
                                    </span>
                                    <div
                                      className={`rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                                        isAdmin
                                          ? 'bg-cyan-600 text-white'
                                          : 'bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100'
                                      }`}
                                    >
                                      {message.content}
                                    </div>
                                    <span className="mt-1 px-1 text-xs text-slate-400">
                                      {formatDate(message.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex items-center gap-2">
                              <RefreshCcw className="h-4 w-4 text-slate-500" />
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">답변 작성</p>
                            </div>
                            <textarea
                              value={drafts[room.id] ?? ''}
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [room.id]: event.target.value,
                                }))
                              }
                              rows={4}
                              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                              placeholder="예: 랩실에서는 이런 식으로 시작하면 좋아요..."
                            />
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleReply(room.id)}
                                disabled={submittingId === room.id}
                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                              >
                                <Send className="h-4 w-4" />
                                {submittingId === room.id ? '보내는 중...' : '답변 보내기'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                              Quick Summary
                            </p>
                            <p className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                              {room.topic || `${room.category} 문의`}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                              학부생이 익명으로 남긴 문의방입니다. 답변은 너무 딱딱하기보다, 실제로 들어왔을 때
                              어떤 식으로 시작할 수 있는지 보여주는 편이 잘 맞습니다.
                            </p>
                          </div>

                          {room.includeTestResult && (
                            <div className="rounded-2xl border border-cyan-100 bg-white p-5 dark:border-cyan-900/40 dark:bg-slate-900">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                                <p className="font-semibold text-slate-900 dark:text-white">첨부된 테스트 결과</p>
                              </div>
                              <p className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                                {room.testResultTitle}
                              </p>
                              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                {room.testResultSummary}
                              </p>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {room.testFitScore !== null && (
                                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                                    성장 궁합도 {room.testFitScore}%
                                  </span>
                                )}
                                {topAxes.map((axis) => (
                                  <span
                                    key={axis}
                                    className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                  >
                                    {axis}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                            <p className="font-semibold text-slate-900 dark:text-white">답변 팁</p>
                            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                              <li>랩실 생활과 시작 포인트를 구체적으로 풀어주면 반응이 좋습니다.</li>
                              <li>AI, 데이터, 취업 연결 포인트를 한 문장씩 자연스럽게 얹으면 설득력이 올라갑니다.</li>
                              <li>부담 없는 다음 행동을 제안하면 문의가 실제 지원 관심으로 이어지기 좋습니다.</li>
                            </ul>
                          </div>

                          <div className="rounded-2xl border border-rose-200 bg-white p-5 dark:border-rose-900/40 dark:bg-slate-900">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-300" />
                              <p className="font-semibold text-slate-900 dark:text-white">접속 기록</p>
                            </div>
                            <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                              <div>
                                <p className="font-semibold text-slate-700 dark:text-slate-200">정책 동의 시점</p>
                                <p>{room.policyAcceptedAt ? formatDate(room.policyAcceptedAt) : '기록 없음'}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-700 dark:text-slate-200">생성 시 IP</p>
                                <p className="break-all">{room.createdIpAddress || room.createdIpMasked || '기록 없음'}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-700 dark:text-slate-200">최근 방문자 IP</p>
                                <p className="break-all">
                                  {room.lastVisitorIpAddress || room.lastVisitorIpMasked || '기록 없음'}
                                </p>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-700 dark:text-slate-200">생성 시 브라우저 정보</p>
                                <p className="break-all text-xs">{room.createdUserAgent || '기록 없음'}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-700 dark:text-slate-200">최근 방문자 브라우저 정보</p>
                                <p className="break-all text-xs">{room.lastVisitorUserAgent || '기록 없음'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
