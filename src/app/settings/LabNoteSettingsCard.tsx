'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Clock3, MessageSquareQuote, Send, StickyNote } from 'lucide-react'
import { saveMyLabNote, type MyLabNoteSettingsData } from '@/actions/lab-note'

type LabNoteSettingsCardProps = MyLabNoteSettingsData

const THEME_OPTIONS = [
  {
    value: 'SKY',
    label: '스카이',
    previewClass: 'from-sky-50 via-cyan-50 to-blue-100 border-sky-200 text-slate-800',
  },
  {
    value: 'CYAN',
    label: '시안',
    previewClass: 'from-cyan-50 via-white to-cyan-100 border-cyan-200 text-slate-800',
  },
  {
    value: 'MINT',
    label: '민트',
    previewClass: 'from-teal-50 via-emerald-50 to-cyan-100 border-emerald-200 text-slate-800',
  },
  {
    value: 'SLATE',
    label: '슬레이트',
    previewClass: 'from-slate-50 via-slate-100 to-blue-100 border-slate-300 text-slate-800',
  },
] as const

function getStatusCopy(status: string) {
  if (status === 'APPROVED') {
    return {
      badge: '공개 중',
      tone: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300',
      description:
        '메모를 저장하면 공개 보드에 바로 반영됩니다. 수정해서 다시 저장하면 최신 내용으로 즉시 바뀝니다.',
    }
  }

  return {
    badge: '아직 미작성',
    tone: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300',
    description: '첫 메모를 저장하면 공개 보드에 바로 올라갑니다.',
  }
}

export function LabNoteSettingsCard({ canManage, defaultDisplayLabel, note }: LabNoteSettingsCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [displayLabel, setDisplayLabel] = useState(
    note?.draftDisplayLabel || note?.publicDisplayLabel || defaultDisplayLabel
  )
  const [content, setContent] = useState(note?.draftContent || note?.publicContent || '')
  const [theme, setTheme] = useState(note?.draftTheme || note?.publicTheme || 'SKY')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  const statusCopy = useMemo(() => getStatusCopy(note?.status || 'EMPTY'), [note?.status])
  const selectedTheme =
    THEME_OPTIONS.find((option) => option.value === theme) || THEME_OPTIONS[0]

  function handleSubmit() {
    setFeedback(null)

    startTransition(async () => {
      const result = await saveMyLabNote({ displayLabel, content, theme })

      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
        return
      }

      setFeedback({
        type: 'success',
        message: '메모를 저장했고, 공개 보드에도 바로 반영했습니다.',
      })
      router.refresh()
    })
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <StickyNote className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">선배 메모 보드</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              이 메모는 승인된 연구생만 작성할 수 있습니다. 현재 계정은 보기 전용입니다.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/40 dark:text-cyan-300">
            <MessageSquareQuote className="h-4 w-4" />
            공개 보드 메모
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">선배들의 한마디</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            연구 성향 테스트 아래 보이는 메모입니다. 1인 1메모, 최대 60자까지 쓸 수 있고 저장하면
            바로 공개됩니다.
          </p>
        </div>

        <div className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusCopy.tone}`}>
          {statusCopy.badge}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
        {statusCopy.description}
      </div>

      {feedback ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
              표시 이름
            </label>
            <input
              type="text"
              value={displayLabel}
              onChange={(event) => setDisplayLabel(event.target.value.slice(0, 24))}
              maxLength={24}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="예: 석사과정, 학부연구생"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              공개 보드에 붙을 이름입니다.
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                메모 내용
              </label>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {content.length} / 60
              </span>
            </div>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value.slice(0, 60))}
              rows={4}
              maxLength={60}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="예: AI에 관심 있으면 생각보다 금방 적응할 수 있어요."
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              처음 보는 학부생도 편하게 읽을 수 있는 짧은 문장을 추천합니다.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
              메모 색상
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    theme === option.value
                      ? 'border-cyan-500 bg-cyan-50 shadow-sm dark:border-cyan-400 dark:bg-cyan-950/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950'
                  }`}
                >
                  <div className={`rounded-xl border bg-gradient-to-br p-3 ${option.previewClass}`}>
                    <p className="text-sm font-semibold">{option.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {isPending ? '저장 중...' : '메모 저장하기'}
            </button>
            {note?.approvedAt ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                최근 공개 {new Date(note.approvedAt).toLocaleDateString('ko-KR')}
              </div>
            ) : null}
            {note?.lastSubmittedAt ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                <Clock3 className="h-4 w-4 text-cyan-500" />
                최근 저장 {new Date(note.lastSubmittedAt).toLocaleDateString('ko-KR')}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-5 dark:border-cyan-900/40 dark:from-slate-950 dark:via-slate-950 dark:to-cyan-950/20">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">미리보기</p>
            <div className="mt-4 rounded-[1.75rem] bg-gradient-to-br from-[#0f5b85] to-[#0a3654] p-5 shadow-lg">
              <article
                className={`mx-auto min-h-[200px] max-w-[280px] rotate-[-3deg] rounded-[0.75rem_1.75rem_0.9rem_1.35rem] border bg-gradient-to-br p-5 shadow-2xl ${selectedTheme.previewClass}`}
              >
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-slate-700">
                  {displayLabel || defaultDisplayLabel}
                </span>
                <p className="mt-5 whitespace-pre-line text-lg font-bold leading-relaxed">
                  {content || '여기에 선배 메모가 붙습니다.'}
                </p>
                <p className="mt-5 text-xs font-semibold text-slate-500">
                  연구 성향 테스트 공개 보드 미리보기
                </p>
              </article>
            </div>
          </div>

          {note?.publicContent ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                현재 공개 중인 메모
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {note.publicContent}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
