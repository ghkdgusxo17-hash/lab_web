import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLabMeeting, LabMeetingDetail, Material } from '../api/client'
import './MeetingDetailPage.css'

const STATUS_INFO: Record<string, { icon: string; text: string; color: string }> = {
    none: { icon: '🎤', text: '녹음 추가', color: '#4a9eff' },
    PENDING: { icon: '⏳', text: '대기 중', color: '#ffa500' },
    PROCESSING: { icon: '⚙️', text: '처리 중', color: '#9b59b6' },
    COMPLETED: { icon: '✅', text: '요약 보기', color: '#2ecc71' },
    FAILED: { icon: '❌', text: '다시 시도', color: '#e74c3c' },
}

// 카테고리 아이콘은 모두 book_icon 사용

function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

export default function MeetingDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [meeting, setMeeting] = useState<LabMeetingDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (id) {
            loadMeeting(id)
        }
    }, [id])

    const loadMeeting = async (meetingId: string) => {
        try {
            setLoading(true)
            setError(null)
            const data = await getLabMeeting(meetingId)
            setMeeting(data)
        } catch (err: any) {
            console.error('Failed to load meeting:', err)
            setError(err.response?.data?.error || '랩미팅 정보를 불러오지 못했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const handleMaterialClick = (material: Material) => {
        const status = material.transcription?.status || 'none'

        if (status === 'none' || status === 'FAILED') {
            navigate(`/record/${material.id}`)
        } else if (status === 'COMPLETED' && material.transcription?.id) {
            navigate(`/summary/${material.transcription.id}`)
        }
    }

    const getStatusInfo = (material: Material) => {
        const status = material.transcription?.status || 'none'
        return STATUS_INFO[status] || STATUS_INFO.none
    }

    if (loading) {
        return (
            <div className="detail-page">
                <header className="header">
                    <button className="back-btn" onClick={() => navigate('/meetings')}>←</button>
                    <h1>미팅 상세</h1>
                    <div style={{ width: 40 }} />
                </header>
                <div className="loading-area">
                    <div className="spinner" />
                    <p>로딩 중...</p>
                </div>
            </div>
        )
    }

    if (error || !meeting) {
        return (
            <div className="detail-page">
                <header className="header">
                    <button className="back-btn" onClick={() => navigate('/meetings')}>←</button>
                    <h1>미팅 상세</h1>
                    <div style={{ width: 40 }} />
                </header>
                <div className="error-area">
                    <p>{error || '랩미팅을 찾을 수 없습니다.'}</p>
                    <button onClick={() => navigate('/meetings')}>목록으로</button>
                </div>
            </div>
        )
    }

    return (
        <div className="detail-page">
            <header className="header">
                <button className="back-btn" onClick={() => navigate('/meetings')}>←</button>
                <h1>미팅 상세</h1>
                <button className="refresh-btn" onClick={() => loadMeeting(id!)}><img src="/re_icon.png" alt="새로고침" className="refresh-icon" /></button>
            </header>

            <div className="meeting-info">
                <h2>{meeting.title}</h2>
                <p className="date">{formatDate(meeting.date)}</p>
                {meeting.description && <p className="desc">{meeting.description}</p>}
                {meeting.presenters.length > 0 && (
                    <p className="presenters">
                        발표자: {meeting.presenters.map(p => p.name || '익명').join(', ')}
                    </p>
                )}
            </div>

            <div className="section-header">
                <span className="section-title">발표자료</span>
                <span className="section-count">{meeting.materials.length}개</span>
            </div>

            <div className="page">
                {meeting.materials.length === 0 ? (
                    <div className="empty-area">
                        <p>등록된 발표자료가 없습니다.</p>
                    </div>
                ) : (
                    meeting.materials.map((material) => {
                        const status = getStatusInfo(material)
                        const transcriptionStatus = material.transcription?.status || 'none'
                        const isDisabled = transcriptionStatus === 'PENDING' || transcriptionStatus === 'PROCESSING'

                        return (
                            <div key={material.id} className="card material-card">
                                <div className="material-header">
                                    <img src="/book_icon.png" alt="자료" className="category-icon" />
                                    <div className="material-info">
                                        <h3 className="material-title">{material.title}</h3>
                                        <p className="material-presenter">
                                            {material.presenter?.name || material.uploader?.name || '알 수 없음'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className="status-btn"
                                    style={{
                                        borderColor: status.color,
                                        backgroundColor: `${status.color}15`,
                                        color: status.color,
                                    }}
                                    onClick={() => handleMaterialClick(material)}
                                    disabled={isDisabled}
                                >
                                    <span>{status.icon}</span>
                                    <span>{status.text}</span>
                                    {transcriptionStatus === 'PROCESSING' && (
                                        <span className="spinner-small" />
                                    )}
                                </button>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
