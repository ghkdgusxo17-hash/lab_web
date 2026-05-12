'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, MessageCircleMore, Search, Sparkles } from 'lucide-react'
import { createAnonymousInquiryRoom } from '@/actions/contact'
import {
  buildAnonymousInquiryConnectClientPath,
  buildAnonymousInquiryEntryCode,
  parseAnonymousInquiryConnectInput,
  parseAnonymousInquiryEntryCode,
} from '@/lib/anonymous-inquiry-entry'

interface TestResultSnapshot {
  title: string
  summary: string
  fitScore: number
  topAxes: string[]
}

const CATEGORY_OPTIONS = ['랩실 생활', '연구 주제', '대학원 고민', '취업/진로'] as const
const STORAGE_KEY = 'cpeLabAptitudeResult'
const VISITOR_KEY = 'cpeLabAnonymousVisitorKey'
const ACCESS_TOKEN_KEY_PREFIX = 'cpeLabAnonymousAccessToken:'

function makeVisitorKey() {
  if (typeof window !== 'undefined' && 'randomUUID' in window.crypto) {
    return window.crypto.randomUUID()
  }

  return `visitor-${Math.random().toString(36).slice(2, 12)}`
}

function getAccessTokenStorageKey(roomCode: string) {
  return `${ACCESS_TOKEN_KEY_PREFIX}${roomCode.toUpperCase()}`
}

function normalizeJoinInput(value: string) {
  return parseAnonymousInquiryEntryCode(value) ?? parseAnonymousInquiryConnectInput(value)
}

export function AnonymousInquiryHub() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [joinError, setJoinError] = useState('')
  const [entryPassword, setEntryPassword] = useState('')
  const [includeResult, setIncludeResult] = useState(false)
  const [acknowledgePolicy, setAcknowledgePolicy] = useState(false)
  const [testSnapshot, setTestSnapshot] = useState<TestResultSnapshot | null>(null)
  const [visitorKey, setVisitorKey] = useState('')

  useEffect(() => {
    const savedVisitorKey = localStorage.getItem(VISITOR_KEY)
    if (savedVisitorKey) {
      setVisitorKey(savedVisitorKey)
    } else {
      const nextVisitorKey = makeVisitorKey()
      localStorage.setItem(VISITOR_KEY, nextVisitorKey)
      setVisitorKey(nextVisitorKey)
    }

    const rawSnapshot = localStorage.getItem(STORAGE_KEY)
    if (!rawSnapshot) {
      return
    }

    try {
      const parsed = JSON.parse(rawSnapshot) as TestResultSnapshot
      if (
        typeof parsed.title === 'string' &&
        typeof parsed.summary === 'string' &&
        typeof parsed.fitScore === 'number' &&
        Array.isArray(parsed.topAxes)
      ) {
        setTestSnapshot(parsed)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  async function handleCreateRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    formData.set('visitorKey', visitorKey)
    formData.set('includeTestResult', includeResult ? 'true' : 'false')
    formData.set('acknowledgePolicy', acknowledgePolicy ? 'true' : 'false')

    if (includeResult && testSnapshot) {
      formData.set('testResultSnapshot', JSON.stringify(testSnapshot))
    }

    const result = await createAnonymousInquiryRoom(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.roomCode && result.accessToken && result.redirectTo) {
      localStorage.setItem(getAccessTokenStorageKey(result.roomCode), result.accessToken)
      router.push(result.redirectTo)
      return
    }

    setLoading(false)
  }

  function handleJoinRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setJoinError('')

    const parsed = normalizeJoinInput(entryPassword)

    if (!parsed) {
      setJoinError('입장 비밀번호를 그대로 붙여 넣어 주세요. 예전 비밀 링크도 자동으로 읽을 수 있습니다.')
      return
    }

    localStorage.setItem(getAccessTokenStorageKey(parsed.roomCode), parsed.accessToken)
    router.push(buildAnonymousInquiryConnectClientPath(parsed.roomCode, parsed.accessToken))
  }

  return (
    <section id="anonymous-inquiry" className="space-y-6">
      <div className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6 dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-950 dark:to-cyan-950/20 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1 text-sm font-semibold text-cyan-700 dark:border-cyan-900/40 dark:bg-slate-950/60 dark:text-cyan-300">
              <Sparkles className="h-4 w-4" />
              익명 문의방
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              로그인 없이 가볍게 물어볼 수 있는 1:1 익명 문의방
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              랩실 생활, 연구 주제, 대학원 고민, 취업/진로처럼 편하게 묻고 싶은 내용을 남겨보세요.
              이제 긴 링크 대신 입장 비밀번호 하나만 저장하면 같은 문의방으로 다시 들어올 수 있어요.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: '대화 방식', value: '1:1 익명 문의' },
              { label: '재입장 방법', value: '비밀번호 1개' },
              { label: '추가 기능', value: '테스트 결과 첨부' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 text-center dark:border-slate-800 dark:bg-slate-950/60"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
              <MessageCircleMore className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">새 익명 문의방 만들기</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                방을 만들면 입장 비밀번호가 자동으로 준비되고, 그 비밀번호로만 다시 들어올 수 있어요.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateRoom} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  닉네임
                </label>
                <input
                  type="text"
                  name="nickname"
                  maxLength={20}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="익명 학부생"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  문의 주제
                </label>
                <select
                  name="category"
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="" disabled>
                    카테고리 선택
                  </option>
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                한 줄 제목
              </label>
              <input
                type="text"
                name="topic"
                maxLength={60}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="학부생이 처음 들어오면 어떤 프로젝트부터 시작하나요?"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                첫 메시지
              </label>
              <textarea
                name="message"
                required
                rows={5}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="궁금한 점을 편하게 적어 주세요. 예를 들면, AI를 배우고 싶은 학부생인데 랩에서는 어떤 식으로 시작하면 좋을지 궁금해요."
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={includeResult}
                  onChange={(event) => setIncludeResult(event.target.checked)}
                  disabled={!testSnapshot}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 disabled:cursor-not-allowed"
                />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">내 테스트 결과도 같이 보내기</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    연구 성향 테스트를 끝낸 상태라면 결과를 함께 전달해서 더 구체적인 답변을 받을 수 있어요.
                  </p>
                </div>
              </label>

              {testSnapshot ? (
                <div className="mt-4 rounded-2xl border border-cyan-100 bg-white px-4 py-4 dark:border-cyan-900/40 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">{testSnapshot.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    성장 궁합도 {testSnapshot.fitScore}% · {testSnapshot.topAxes.join(' / ')}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  아직 저장된 테스트 결과가 없어요. 먼저 연구 성향 테스트를 완료하면 결과를 함께 보낼 수 있습니다.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-relaxed text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
              욕설, 비방, 인신공격, 허위사실 유포 등은 허용되지 않습니다. 안전한 운영을 위해 접속 IP와 브라우저 정보가
              관리자 확인용으로 저장되며, 심각한 경우 이용 제한 또는 관련 법적 조치가 취해질 수 있습니다.
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950/50">
              <input
                type="checkbox"
                checked={acknowledgePolicy}
                onChange={(event) => setAcknowledgePolicy(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  안내 문구를 확인했고, 접속 IP 및 브라우저 정보 저장에 동의합니다.
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  익명 문의의 안전한 운영을 위해 최초 작성과 이후 메시지 전송 시 접속 정보가 관리자 확인용으로 기록됩니다.
                </p>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading || !acknowledgePolicy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {loading ? '문의방 만드는 중...' : '익명 문의방 만들기'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">입장 비밀번호로 다시 들어가기</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  예전에 받은 비밀번호를 붙여 넣으면 같은 문의방으로 다시 연결됩니다.
                </p>
              </div>
            </div>

            <form onSubmit={handleJoinRoom} className="mt-6 space-y-4">
              {joinError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                  {joinError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  입장 비밀번호
                </label>
                <input
                  type="text"
                  value={entryPassword}
                  onChange={(event) => setEntryPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="S3XV3Z-F575-WFZC-DKCX-KDUW-W8"
                />
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  예전에 저장한 링크가 있다면 그대로 붙여 넣어도 자동으로 읽어드립니다.
                </p>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
              >
                익명 문의방 들어가기
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">이런 질문도 잘 맞아요</h4>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <li>랩실 분위기나 생활이 실제로 어떤지 궁금할 때</li>
              <li>AI, 데이터, 공정 연구가 진학이나 취업과 어떻게 연결되는지 묻고 싶을 때</li>
              <li>대학원 진학이 아직 확실치 않지만 가볍게 상담받고 싶을 때</li>
              <li>연구 성향 테스트 결과를 바탕으로 더 구체적인 조언을 얻고 싶을 때</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
