'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, Play, Pause } from 'lucide-react'
import { checkTranscriptionStatus } from '@/actions/meeting-transcription'

interface Segment {
    Start: number
    End: number
    Speaker: number
    Content: string
}

interface Props {
    transcription: {
        id: string
        status: string
        summary: string | null
        transcript: string | null
        error: string | null
        audioUrl: string
        audioFilename: string | null
    }
}

export function TranscriptionDetail({ transcription: initialTranscription }: Props) {
    const [transcription, setTranscription] = useState(initialTranscription)
    const [showTranscript, setShowTranscript] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

    // Poll for updates if still processing
    useEffect(() => {
        if (transcription.status === 'PENDING' || transcription.status === 'PROCESSING') {
            const interval = setInterval(async () => {
                const result = await checkTranscriptionStatus(transcription.id)
                if (result) {
                    setTranscription(prev => ({
                        ...prev,
                        status: result.status,
                        summary: result.summary || prev.summary,
                        error: result.error || prev.error
                    }))

                    if (result.status === 'COMPLETED' || result.status === 'FAILED') {
                        clearInterval(interval)
                        // Reload page to get full data
                        window.location.reload()
                    }
                }
            }, 10000) // Poll every 10 seconds

            return () => clearInterval(interval)
        }
    }, [transcription.status, transcription.id])

    // Parse transcript segments
    const segments: Segment[] = transcription.transcript
        ? JSON.parse(transcription.transcript)?.segments || []
        : []

    // Group segments by speaker
    const speakerColors = [
        'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
        'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
        'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
        'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
        'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200',
    ]

    function formatTime(seconds: number) {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    function toggleAudio() {
        if (!audioElement) {
            const audio = new Audio(transcription.audioUrl)
            audio.onended = () => setIsPlaying(false)
            setAudioElement(audio)
            audio.play()
            setIsPlaying(true)
        } else {
            if (isPlaying) {
                audioElement.pause()
                setIsPlaying(false)
            } else {
                audioElement.play()
                setIsPlaying(true)
            }
        }
    }

    // Processing status
    if (transcription.status === 'PENDING' || transcription.status === 'PROCESSING') {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center">
                <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {transcription.status === 'PENDING' ? '처리 대기 중...' : '처리 중...'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                    음성을 텍스트로 변환하고 요약을 생성하고 있습니다.
                </p>
                <p className="text-sm text-slate-500">
                    오디오 길이에 따라 10~30분 정도 소요됩니다.
                </p>
            </div>
        )
    }

    // Failed status
    if (transcription.status === 'FAILED') {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-red-200 dark:border-red-800 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    처리 실패
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {transcription.error || '알 수 없는 오류가 발생했습니다.'}
                </p>
            </div>
        )
    }

    // Completed - show summary and transcript
    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        요약
                    </h2>
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    {transcription.summary ? (
                        <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                            {transcription.summary}
                        </div>
                    ) : (
                        <p className="text-slate-500">요약이 없습니다.</p>
                    )}
                </div>
            </div>

            {/* Audio Player */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleAudio}
                        className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >
                        {isPlaying ? (
                            <Pause className="w-5 h-5" />
                        ) : (
                            <Play className="w-5 h-5" />
                        )}
                    </button>
                    <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">
                            {transcription.audioFilename || '오디오 파일'}
                        </p>
                        <p className="text-sm text-slate-500">
                            원본 녹음 파일
                        </p>
                    </div>
                </div>
            </div>

            {/* Transcript */}
            {segments.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <button
                        onClick={() => setShowTranscript(!showTranscript)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            전체 트랜스크립션 ({segments.length}개 세그먼트)
                        </h2>
                        {showTranscript ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                    </button>

                    {showTranscript && (
                        <div className="px-6 pb-6 space-y-3 max-h-[600px] overflow-y-auto">
                            {segments.map((segment, index) => (
                                <div
                                    key={index}
                                    className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                                >
                                    <div className="flex-shrink-0">
                                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${speakerColors[segment.Speaker % speakerColors.length]}`}>
                                            화자 {segment.Speaker + 1}
                                        </span>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {formatTime(segment.Start)}
                                        </p>
                                    </div>
                                    <p className="flex-1 text-slate-700 dark:text-slate-300">
                                        {segment.Content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
