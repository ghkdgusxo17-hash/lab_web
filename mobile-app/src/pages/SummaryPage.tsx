import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTranscription, Transcription } from '../api/client'
import './SummaryPage.css'

const SPEAKER_COLORS = ['#4a9eff', '#ff6b6b', '#2ecc71', '#f39c12']

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

function formatDateTime(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

interface TranscriptSegment {
    time: number
    speaker: number
    text: string
}

function parseTranscript(transcript: string | null): TranscriptSegment[] {
    if (!transcript) return []

    const segments: TranscriptSegment[] = []
    const lines = transcript.split('\n')

    for (const line of lines) {
        // Parse format: [00:00:00 - 00:00:05] 화자 1: 텍스트
        const match = line.match(/\[(\d{2}):(\d{2}):(\d{2})\s*-\s*\d{2}:\d{2}:\d{2}\]\s*화자\s*(\d+):\s*(.+)/)
        if (match) {
            const hours = parseInt(match[1])
            const mins = parseInt(match[2])
            const secs = parseInt(match[3])
            const speaker = parseInt(match[4]) - 1
            const text = match[5]

            segments.push({
                time: hours * 3600 + mins * 60 + secs,
                speaker,
                text,
            })
        }
    }

    return segments
}

function AudioPlayer({ src }: { src: string }) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const progressRef = useRef<HTMLDivElement>(null)
    const [playing, setPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [dur, setDur] = useState(0)

    const toggle = useCallback(() => {
        const a = audioRef.current
        if (!a) return
        if (playing) { a.pause() } else { a.play() }
        setPlaying(!playing)
    }, [playing])

    const seek = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        const a = audioRef.current
        const bar = progressRef.current
        if (!a || !bar || !dur) return
        const rect = bar.getBoundingClientRect()
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
        a.currentTime = ratio * dur
    }, [dur])

    const pct = dur > 0 ? (currentTime / dur) * 100 : 0

    return (
        <div className="custom-audio-player">
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDur(audioRef.current?.duration || 0)}
                onEnded={() => setPlaying(false)}
            />
            <button className="play-btn" onClick={toggle}>
                {playing ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <rect x="4" y="3" width="4.5" height="14" rx="1.2" />
                        <rect x="11.5" y="3" width="4.5" height="14" rx="1.2" />
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 3.5a1 1 0 0 1 1.53-.85l10 6.5a1 1 0 0 1 0 1.7l-10 6.5A1 1 0 0 1 5 16.5v-13z" />
                    </svg>
                )}
            </button>
            <span className="audio-time">{formatTime(currentTime)}</span>
            <div
                className="progress-bar"
                ref={progressRef}
                onClick={seek}
                onTouchMove={seek}
            >
                <div className="progress-fill" style={{ width: `${pct}%` }} />
                <div className="progress-thumb" style={{ left: `${pct}%` }} />
            </div>
            <span className="audio-time">{formatTime(dur)}</span>
        </div>
    )
}

export default function SummaryPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [transcription, setTranscription] = useState<Transcription | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showTranscript, setShowTranscript] = useState(false)

    useEffect(() => {
        if (id) {
            loadTranscription(id)
        }
    }, [id])

    const loadTranscription = async (transcriptionId: string) => {
        try {
            setLoading(true)
            setError(null)
            const data = await getTranscription(transcriptionId)
            setTranscription(data)
        } catch (err: any) {
            console.error('Failed to load transcription:', err)
            setError(err.response?.data?.error || '요약 정보를 불러오지 못했습니다.')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="summary-page">
                <header className="header">
                    <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                    <h1>요약</h1>
                    <div style={{ width: 40 }} />
                </header>
                <div className="page">
                    <div className="loading-area">
                        <div className="spinner" />
                        <p>로딩 중...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !transcription) {
        return (
            <div className="summary-page">
                <header className="header">
                    <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                    <h1>요약</h1>
                    <div style={{ width: 40 }} />
                </header>
                <div className="page">
                    <div className="error-area">
                        <p>{error || '요약 정보를 찾을 수 없습니다.'}</p>
                        <button onClick={() => navigate(-1)}>돌아가기</button>
                    </div>
                </div>
            </div>
        )
    }

    const transcriptSegments = parseTranscript(transcription.transcript)

    return (
        <div className="summary-page">
            <header className="header">
                <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                <h1>요약</h1>
                <button
                    className="refresh-btn"
                    onClick={() => loadTranscription(id!)}
                ><img src="/re_icon.png" alt="새로고침" className="refresh-icon" /></button>
            </header>

            <div className="page">
                <div className="card info-card">
                    <h2>{transcription.material.title}</h2>
                    {transcription.material.labMeeting && (
                        <p className="meta">
                            {transcription.material.labMeeting.title} • {formatDate(transcription.material.labMeeting.date)}
                        </p>
                    )}
                    <p className="recorder">
                        녹음: {transcription.recorder.name || '알 수 없음'} • {formatDateTime(transcription.createdAt)}
                    </p>
                </div>

                {transcription.status === 'PROCESSING' && (
                    <div className="card status-card processing">
                        <div className="spinner" />
                        <p>처리 중입니다... 잠시 후 새로고침해주세요.</p>
                    </div>
                )}

                {transcription.status === 'FAILED' && (
                    <div className="card status-card failed">
                        <p>❌ 처리 실패</p>
                        <p className="error-detail">{transcription.error || '알 수 없는 오류가 발생했습니다.'}</p>
                    </div>
                )}

                {transcription.summary && (
                    <div className="card">
                        <div className="section-header">
                            <span className="emoji">📝</span>
                            <h3>AI 요약</h3>
                        </div>
                        <div className="summary-content">
                            {transcription.summary.split('\n').map((line, i) => (
                                <p key={i} style={{
                                    marginBottom: line.startsWith('#') ? '12px' : '8px',
                                    fontWeight: line.startsWith('#') ? 'bold' : 'normal',
                                }}>
                                    {line.replace(/^#+\s/, '').replace(/\*\*/g, '')}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {transcription.transcript && (
                    <div className="card">
                        <button
                            className="section-header clickable"
                            onClick={() => setShowTranscript(!showTranscript)}
                        >
                            <span className="emoji">🎙️</span>
                            <h3>전체 트랜스크립트</h3>
                            <span className="toggle-icon">{showTranscript ? '▲' : '▼'}</span>
                        </button>

                        {showTranscript && (
                            <div className="transcript-content">
                                {transcriptSegments.length > 0 ? (
                                    transcriptSegments.map((segment, i) => (
                                        <div key={i} className="segment">
                                            <span className="timestamp">{formatTime(segment.time)}</span>
                                            <div className="segment-content">
                                                <span
                                                    className="speaker-label"
                                                    style={{ color: SPEAKER_COLORS[segment.speaker % SPEAKER_COLORS.length] }}
                                                >
                                                    화자 {segment.speaker + 1}
                                                </span>
                                                <p className="segment-text">{segment.text}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <pre className="transcript-raw">{transcription.transcript}</pre>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {transcription.audioUrl && (
                    <div className="card audio-card">
                        <div className="section-header">
                            <span className="emoji">🔊</span>
                            <h3>녹음 오디오</h3>
                        </div>
                        <AudioPlayer src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api${transcription.audioUrl}`} />
                    </div>
                )}
            </div>
        </div>
    )
}
