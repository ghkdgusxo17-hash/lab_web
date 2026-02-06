import { useState, useEffect } from 'react'
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
                    <a
                        href={transcription.audioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline w-full"
                    >
                        <span>▶️</span> 오디오 재생
                    </a>
                )}
            </div>
        </div>
    )
}
