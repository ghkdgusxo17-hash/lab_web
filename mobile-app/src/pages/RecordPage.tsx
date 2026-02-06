import { useState, useRef, useEffect } from 'react'
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

    const mediaRecorder = useRef<MediaRecorder | null>(null)
    const audioChunks = useRef<Blob[]>([])
    const timerRef = useRef<number | null>(null)

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
                mediaRecorder.current.stop()
            }
        }
    }, [])

    const startRecording = async () => {
        try {
            setError(null)
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

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

    return (
        <div className="record-page">
            <button className="close-btn" onClick={handleClose}>✕</button>

            <div className="record-info">
                <span className="label">녹음 대상</span>
                <span className="title">발표자료 #{materialId}</span>
            </div>

            <div className="timer-area">
                <div className={`timer-circle ${state === 'recording' ? 'active' : ''}`}>
                    <span className="timer-text">{formatTime(duration)}</span>
                    {state === 'recording' && <div className="recording-dot" />}
                </div>
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
