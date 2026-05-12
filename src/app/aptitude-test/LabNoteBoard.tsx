'use client'

import Link from 'next/link'
import { ArrowRight, MessageCircle, Pin, StickyNote } from 'lucide-react'
import type { PublicLabNote } from '@/actions/lab-note'

interface LabNoteBoardProps {
  notes: PublicLabNote[]
}

const NOTE_THEME_CLASSES: Record<string, string> = {
  SKY: 'from-[#fffdf2] via-[#fff4ad] to-[#ffe16a] border-yellow-300 text-amber-950',
  CYAN: 'from-[#fffceb] via-[#ffef99] to-[#ffd95a] border-amber-300 text-amber-950',
  MINT: 'from-[#fffef4] via-[#fff1b8] to-[#ffe680] border-yellow-300 text-amber-950',
  SLATE: 'from-[#fffef6] via-[#fff5c7] to-[#ffeaa0] border-yellow-200 text-amber-950',
}

const NOTE_ROTATIONS = ['rotate-[-4deg]', 'rotate-[3deg]', 'rotate-[-2deg]', 'rotate-[4deg]', 'rotate-[-3deg]', 'rotate-[2deg]']

export function LabNoteBoard({ notes }: LabNoteBoardProps) {
  const visibleNotes = notes.slice(0, 6)

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-none md:p-8">
      <div
        aria-hidden="true"
        className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-yellow-100/70 blur-3xl dark:bg-yellow-500/10"
      />
      <div
        aria-hidden="true"
        className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-amber-100/70 blur-3xl dark:bg-amber-500/10"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(253,224,71,0.12),transparent_28%),linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:auto,28px_28px,28px_28px]"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-sm font-semibold text-amber-700 shadow-sm dark:border-yellow-900/40 dark:bg-slate-900 dark:text-yellow-300">
            <StickyNote className="h-4 w-4" />
            공식 소개엔 없는 선배 메모
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            선배들의 한마디
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            공식 소개보다 조금 더 솔직하고, 그렇다고 너무 무겁진 않은 랩실 메모예요. 연구실 구성원들이 개인 설정에서
            직접 남긴 짧은 코멘트만 공개됩니다.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
          {[
            { label: '열리는 방식', value: '테스트 결과 화면 위에서 크게 펼쳐보기' },
            { label: '작성 방식', value: '연구생 개인 설정에서 1인 1메모' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
              <p className="mt-2 text-sm font-bold leading-relaxed text-slate-900 dark:text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="relative overflow-hidden rounded-[1.85rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fffef9_100%)] p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"
          />
          <div
            aria-hidden="true"
            className="absolute -right-10 top-6 h-36 w-36 rounded-full bg-yellow-100/80 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute left-8 bottom-2 h-28 w-28 rounded-full bg-amber-100/80 blur-2xl"
          />

          <div className="relative mb-4 flex items-center justify-between gap-3 rounded-2xl border border-yellow-200 bg-yellow-50/80 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Pinned Notes</p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">연구실 분위기를 담은 메모 보드</p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-2 text-right text-xs font-semibold text-amber-700 shadow-sm">
              {visibleNotes.length > 0 ? `${visibleNotes.length} notes` : 'coming soon'}
            </div>
          </div>

          <div className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleNotes.length > 0 ? (
              visibleNotes.map((note, index) => {
                const themeClass = NOTE_THEME_CLASSES[note.theme] || NOTE_THEME_CLASSES.SKY
                return (
                  <article
                    key={note.id}
                    className={`relative min-h-[190px] rounded-[0.75rem_1.75rem_0.9rem_1.35rem] border bg-gradient-to-br p-5 shadow-[0_18px_34px_rgba(217,119,6,0.18)] transition duration-200 hover:-translate-y-1.5 hover:rotate-0 ${themeClass} ${NOTE_ROTATIONS[index % NOTE_ROTATIONS.length]}`}
                  >
                    <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 p-1 text-white shadow-md shadow-orange-900/20">
                      <Pin className="h-3.5 w-3.5" />
                    </div>
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-6 top-0 h-10 rounded-b-2xl bg-white/45 blur-xl"
                    />
                    <span className="relative mt-4 inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-amber-800 shadow-sm">
                      {note.displayLabel}
                    </span>
                    <p className="relative mt-4 text-lg font-bold leading-relaxed">{note.content}</p>
                    <div className="relative mt-5 h-px bg-amber-300/70" />
                    <p className="relative mt-4 text-xs font-semibold text-amber-700/80">
                      {note.approvedAt ? new Date(note.approvedAt).toLocaleDateString('ko-KR') : '승인 완료'}
                    </p>
                  </article>
                )
              })
            ) : (
              <article className="min-h-[210px] rounded-[0.75rem_1.75rem_0.9rem_1.35rem] border border-yellow-300 bg-gradient-to-br from-[#fffef4] via-[#fff4b8] to-[#ffe37b] p-6 text-amber-950 shadow-[0_18px_34px_rgba(217,119,6,0.16)]">
                <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-amber-800 shadow-sm">
                  메모 준비 중
                </span>
                <p className="mt-5 text-lg font-bold leading-relaxed">
                  첫 선배 메모가 곧 붙을 예정이에요. 조금만 기다리면 연구실 분위기가 담긴 한마디가 이 보드에 차곡차곡
                  모입니다.
                </p>
              </article>
            )}
          </div>
        </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">보드 메모 기준</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <li>짧고 솔직하게, 그래도 공개 사이트 톤은 지키기</li>
                <li>랩실 생활, 배움의 흐름, 분위기가 느껴지는 문장 중심</li>
                <li>모든 메모는 개인 설정에서 작성 후 관리자 확인 뒤 공개</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">다음 행동</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                보드 분위기가 괜찮아 보였다면, 테스트 결과를 바탕으로 익명 문의방에서 편하게 질문해보세요.
            </p>
            <div className="mt-4 grid gap-3">
              <Link
                href="/contact/anonymous"
                className="group inline-flex min-h-[54px] items-center justify-between rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-900"
              >
                <span className="whitespace-nowrap">익명으로 더 물어보기</span>
                <MessageCircle className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/about"
                className="group inline-flex min-h-[54px] items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50/60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:bg-slate-900"
              >
                <span className="whitespace-nowrap">연구실 소개 더 보기</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
