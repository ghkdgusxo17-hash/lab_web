'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, X, Loader2 } from 'lucide-react'
import { awardMedal, revokeMedal } from '@/actions/medal'

interface Presenter {
    id: string
    name: string | null
    image: string | null
}

interface MedalAwardData {
    id: string
    type: string
    recipient: {
        id: string
        name: string | null
        image: string | null
    }
    awarder: {
        id: string
        name: string | null
    }
}

interface MedalAwardSectionProps {
    labMeetingId: string
    presenters: Presenter[]
    existingAwards: MedalAwardData[]
}

export function MedalAwardSection({ labMeetingId, presenters, existingAwards }: MedalAwardSectionProps) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)
    const [error, setError] = useState('')

    async function handleAward(recipientId: string) {
        setLoading(recipientId)
        setError('')

        const result = await awardMedal(recipientId, labMeetingId, 'MVP')

        if (result.error) {
            setError(result.error)
        } else {
            router.refresh()
        }
        setLoading(null)
    }

    async function handleRevoke(awardId: string) {
        if (!confirm('MVP를 회수하시겠습니까?')) return

        setLoading(awardId)
        setError('')

        const result = await revokeMedal(awardId)

        if (result.error) {
            setError(result.error)
        } else {
            router.refresh()
        }
        setLoading(null)
    }

    function getAwardForPresenter(presenterId: string) {
        return existingAwards.find(a => a.recipient.id === presenterId)
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/50 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                MVP 수여
            </h2>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {presenters.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">발표자가 없습니다.</p>
            ) : (
                <div className="space-y-3">
                    {presenters.map((presenter) => {
                        const existingAward = getAwardForPresenter(presenter.id)

                        return (
                            <div
                                key={presenter.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                            >
                                <div className="flex items-center gap-3">
                                    {presenter.image ? (
                                        <img
                                            src={presenter.image}
                                            alt={presenter.name || ''}
                                            className="w-8 h-8 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-500">
                                            {presenter.name?.slice(0, 1) || '?'}
                                        </div>
                                    )}
                                    <span className="font-medium text-slate-900 dark:text-white text-sm">
                                        {presenter.name || '이름 없음'}
                                    </span>

                                    {existingAward && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                            <Trophy className="w-3 h-3" /> MVP
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {existingAward ? (
                                        <button
                                            onClick={() => handleRevoke(existingAward.id)}
                                            disabled={loading === existingAward.id}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {loading === existingAward.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <X className="w-3 h-3" />
                                            )}
                                            회수
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleAward(presenter.id)}
                                            disabled={!!loading}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            {loading === presenter.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Trophy className="w-3 h-3" />
                                            )}
                                            MVP
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                MVP 1회당 1점 &middot; 누적 포인트에 따라 훈장 등급이 올라갑니다
            </p>
        </div>
    )
}
