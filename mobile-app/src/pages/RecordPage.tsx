import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { uploadTranscription } from '../api/client'
import './RecordPage.css'

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'uploading'

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function RecordPage() {
    const { materialId } = useParams()
    const navigate = useNavigate()

    const [state, setState] = useState<RecordingState>('idle')
    const [duration, setDuration] = useState(0)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [audioLevel, setAudioLevel] = useState(0)

    const mediaRecorder = useRef<MediaRecorder | null>(null)
    const audioChunks = useRef<Blob[]>([])
    const timerRef = useRef<number | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const animFrameRef = useRef<number | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const cleanupAudio = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current)
            animFrameRef.current = null
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close()
            audioContextRef.current = null
        }
        analyserRef.current = null
        setAudioLevel(0)
    }, [])

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
                mediaRecorder.current.stop()
            }
            cleanupAudio()
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [cleanupAudio])

    // 실시간 음량 측정
    const startAudioAnalysis = useCallback((stream: MediaStream) => {
        const audioContext = new AudioContext()
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.5

        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        audioContextRef.current = audioContext
        analyserRef.current = analyser

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const updateLevel = () => {
            if (!analyserRef.current) return
            analyserRef.current.getByteFrequencyData(dataArray)
            // 평균 음량 계산 (0~255 → 0~1)
            const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length
            setAudioLevel(Math.min(avg / 128, 1))
            animFrameRef.current = requestAnimationFrame(updateLevel)
        }
        updateLevel()
    }, [])

    const startRecording = async () => {
        try {
            setError(null)
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            // 음량 분석 시작
            startAudioAnalysis(stream)

            const recorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            })

            audioChunks.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunks.current.push(e.data)
                }
            }

            recorder.onstop = () => {
                const blob = new Blob(audioChunks.current, { type: recorder.mimeType })
                setAudioBlob(blob)
                stream.getTracks().forEach(track => track.stop())
                cleanupAudio()
            }

            mediaRecorder.current = recorder
            recorder.start(1000) // 1초마다 데이터 수집
            setState('recording')
            setDuration(0)

            timerRef.current = window.setInterval(() => {
                setDuration(d => d + 1)
            }, 1000)

        } catch (err) {
            console.error('Recording error:', err)
            setError('마이크 접근이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.')
        }
    }

    const pauseRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.pause()
            setState('paused')
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const resumeRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'paused') {
            mediaRecorder.current.resume()
            setState('recording')
            timerRef.current = window.setInterval(() => {
                setDuration(d => d + 1)
            }, 1000)
        }
    }

    const stopRecording = () => {
        if (mediaRecorder.current) {
            mediaRecorder.current.stop()
            setState('stopped')
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const handleUpload = async () => {
        if (!audioBlob || !materialId) return

        setState('uploading')
        setError(null)

        try {
            // 파일명 생성: material_id_timestamp.webm
            const ext = audioBlob.type.includes('webm') ? 'webm' : 'm4a'
            const filename = `recording_${materialId}_${Date.now()}.${ext}`

            // API로 업로드
            const result = await uploadTranscription(materialId, audioBlob, filename)

            if (result.transcriptionId) {
                alert('업로드 완료! 처리에 10~30분이 소요됩니다.\n처리가 완료되면 요약 결과를 확인할 수 있습니다.')
                navigate(-1)
            }
        } catch (err: any) {
            console.error('Upload error:', err)
            setError(err.response?.data?.error || '업로드에 실패했습니다. 다시 시도해주세요.')
            setState('stopped')
        }
    }

    const handleRetry = () => {
        setAudioBlob(null)
        setDuration(0)
        setState('idle')
    }

    const handleClose = () => {
        if (state === 'recording' || state === 'paused') {
            if (confirm('녹음을 취소하시겠습니까?')) {
                if (mediaRecorder.current) {
                    mediaRecorder.current.stop()
                }
                if (timerRef.current) clearInterval(timerRef.current)
                navigate(-1)
            }
        } else {
            navigate(-1)
        }
    }

    // 음량에 따른 시각 효과
    const glowSize = state === 'recording' ? 8 + audioLevel * 24 : 0
    const glowOpacity = state === 'recording' ? 0.1 + audioLevel * 0.3 : 0
    const borderWidth = state === 'recording' ? 3 + audioLevel * 3 : 3

    return (
        <div className="record-page">
            <button className="close-btn" onClick={handleClose}>✕</button>

            <div className="record-info">
                <span className="label">녹음 대상</span>
                <span className="title">발표자료 #{materialId}</span>
            </div>

            <div className="timer-area">
                <div
                    className={`timer-circle ${state === 'recording' ? 'active' : ''}`}
                    style={state === 'recording' ? {
                        borderWidth: `${borderWidth}px`,
                        boxShadow: `0 0 0 ${glowSize}px rgba(255, 59, 48, ${glowOpacity}), 0 8px 32px rgba(0,0,0,0.1)`,
                    } : undefined}
                >
                    <span className="timer-text">{formatTime(duration)}</span>
                    {state === 'recording' && <div className="recording-dot" />}
                </div>

                {/* 음량 바 */}
                {(state === 'recording' || state === 'paused') && (
                    <div className="audio-level-container">
                        <div className="audio-level-bars">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const threshold = i / 20
                                const isActive = state === 'recording' && audioLevel > threshold
                                const barColor = i < 12 ? 'var(--tint)' : i < 16 ? '#ffa500' : 'var(--danger)'
                                return (
                                    <div
                                        key={i}
                                        className="audio-level-bar"
                                        style={{
                                            backgroundColor: isActive ? barColor : 'var(--separator)',
                                            opacity: isActive ? 1 : 0.3,
                                        }}
                                    />
                                )
                            })}
                        </div>
                        <span className="audio-level-label">
                            {state === 'paused' ? '일시정지' : audioLevel > 0.05 ? '음성 감지 중' : '대기 중...'}
                        </span>
                    </div>
                )}
            </div>

            {error && <p className="error-message">{error}</p>}

            <p className="status-message">
                {state === 'idle' && '녹음 버튼을 눌러 시작하세요'}
                {state === 'recording' && '녹음 중...'}
                {state === 'paused' && '일시정지됨'}
                {state === 'stopped' && '녹음이 완료되었습니다'}
                {state === 'uploading' && '업로드 중...'}
            </p>

            <div className="controls">
                {state === 'idle' && (
                    <button className="record-btn" onClick={startRecording}>
                        <div className="record-inner" />
                    </button>
                )}

                {state === 'recording' && (
                    <div className="control-row">
                        <button className="control-btn" onClick={pauseRecording}>
                            <span>⏸️</span>
                            <span>일시정지</span>
                        </button>
                        <button className="stop-btn" onClick={stopRecording}>
                            <div className="stop-inner" />
                        </button>
                    </div>
                )}

                {state === 'paused' && (
                    <div className="control-row">
                        <button className="control-btn" onClick={resumeRecording}>
                            <span>▶️</span>
                            <span>재개</span>
                        </button>
                        <button className="stop-btn" onClick={stopRecording}>
                            <div className="stop-inner" />
                        </button>
                    </div>
                )}

                {state === 'stopped' && (
                    <div className="action-buttons">
                        <button className="btn btn-outline" onClick={handleRetry}>
                            다시 녹음
                        </button>
                        <button className="btn btn-primary" onClick={handleUpload}>
                            업로드
                        </button>
                    </div>
                )}

                {state === 'uploading' && (
                    <div className="uploading">
                        <div className="spinner" />
                        <p>업로드 중...</p>
                    </div>
                )}
            </div>

            <p className="hint">
                💡 발표 전체를 녹음해주세요. 처리에 10~30분 소요됩니다.
            </p>
        </div>
    )
}
