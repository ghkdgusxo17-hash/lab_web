'use client'

import { useState, useTransition } from 'react'
import { BarChart3, Check, Clock, Users } from 'lucide-react'
import { votePoll } from '@/actions/post-interaction'

interface PollOption {
    id: string
    text: string
    voteCount: number
    percentage: number
    voters: { name: string | null; image: string | null }[]
}

interface PollData {
    id: string
    question: string
    isMultiple: boolean
    isAnonymous: boolean
    endsAt: Date | null
    isEnded: boolean
    totalVotes: number
    options: PollOption[]
    userVotes: string[]
    hasVoted: boolean
}

interface PollSectionProps {
    poll: PollData
    canVote: boolean
}

export function PollSection({ poll, canVote }: PollSectionProps) {
    const [isPending, startTransition] = useTransition()
    const [selectedOptions, setSelectedOptions] = useState<string[]>(poll.userVotes)
    const [hasVoted, setHasVoted] = useState(poll.hasVoted)

    function handleOptionClick(optionId: string) {
        if (hasVoted || poll.isEnded) return

        if (poll.isMultiple) {
            // 복수 선택
            setSelectedOptions(prev =>
                prev.includes(optionId)
                    ? prev.filter(id => id !== optionId)
                    : [...prev, optionId]
            )
        } else {
            // 단일 선택
            setSelectedOptions([optionId])
        }
    }

    function handleVote() {
        if (!canVote) {
            alert('승인된 멤버만 투표할 수 있습니다.')
            return
        }

        if (selectedOptions.length === 0) {
            alert('옵션을 선택해주세요.')
            return
        }

        startTransition(async () => {
            const result = await votePoll(selectedOptions)
            if (result.error) {
                alert(result.error)
            } else {
                setHasVoted(true)
            }
        })
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-bold text-slate-900 dark:text-white">투표</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    {poll.isAnonymous && (
                        <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            익명
                        </span>
                    )}
                    {poll.isMultiple && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                            복수 선택
                        </span>
                    )}
                </div>
            </div>

            {/* Question */}
            <p className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                {poll.question}
            </p>

            {/* Options */}
            <div className="space-y-2 mb-4">
                {poll.options.map((option) => {
                    const isSelected = selectedOptions.includes(option.id)
                    const showResults = hasVoted || poll.isEnded

                    return (
                        <div
                            key={option.id}
                            onClick={() => !showResults && handleOptionClick(option.id)}
                            className={`relative overflow-hidden rounded-lg border transition-all ${
                                showResults
                                    ? 'cursor-default'
                                    : 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-500'
                            } ${
                                isSelected
                                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                            }`}
                        >
                            {/* Progress bar (only show when voted) */}
                            {showResults && (
                                <div
                                    className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 transition-all"
                                    style={{ width: `${option.percentage}%` }}
                                />
                            )}

                            <div className="relative flex items-center justify-between p-3">
                                <div className="flex items-center gap-3">
                                    {!showResults && (
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            isSelected
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    )}
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {option.text}
                                    </span>
                                </div>

                                {showResults && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {option.percentage}%
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            ({option.voteCount}표)
                                        </span>
                                        {isSelected && (
                                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>{poll.totalVotes}명 참여</span>
                    {poll.endsAt && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {poll.isEnded ? '마감됨' : `${formatDate(poll.endsAt)} 마감`}
                        </span>
                    )}
                </div>

                {!hasVoted && !poll.isEnded && (
                    <button
                        onClick={handleVote}
                        disabled={isPending || selectedOptions.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isPending ? '투표 중...' : '투표하기'}
                    </button>
                )}
            </div>
        </div>
    )
}
