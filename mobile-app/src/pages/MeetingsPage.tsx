import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getLabMeetings, LabMeeting } from '../api/client'
import './MeetingsPage.css'

function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
    })
}

export default function MeetingsPage() {
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()
    const [meetings, setMeetings] = useState<LabMeeting[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadMeetings()
    }, [])

    const loadMeetings = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await getLabMeetings()
            setMeetings(data)
        } catch (err: any) {
            console.error('Failed to load meetings:', err)
            setError(err.response?.data?.error || '랩미팅 목록을 불러오지 못했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const handleRefresh = () => {
        loadMeetings()
    }

    return (
        <div className="meetings-page">
            <header className="header">
                <div className="user-info">
                    <span className="welcome">안녕하세요,</span>
                    <span className="user-name">{user?.name || '사용자'}님</span>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                    로그아웃
                </button>
            </header>

            <div className="page">
                <div className="section-header-row">
                    <h2 className="section-title">랩미팅 목록</h2>
                    <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
                        {loading ? <div className="spinner" /> : <img src="/re_icon.png" alt="새로고침" className="refresh-icon" />}
                    </button>
                </div>

                {error && (
                    <div className="error-card">
                        <p>{error}</p>
                        <button onClick={handleRefresh}>다시 시도</button>
                    </div>
                )}

                {loading && meetings.length === 0 ? (
                    <div className="loading-area">
                        <div className="spinner" />
                        <p>로딩 중...</p>
                    </div>
                ) : meetings.length === 0 ? (
                    <div className="empty-area">
                        <p>등록된 랩미팅이 없습니다.</p>
                    </div>
                ) : (
                    <div className="meeting-list">
                        {meetings.map((meeting) => (
                            <div
                                key={meeting.id}
                                className="card meeting-card"
                                onClick={() => navigate(`/meeting/${meeting.id}`)}
                            >
                                <div className="meeting-header">
                                    <span className="meeting-date">{formatDate(meeting.date)}</span>
                                    <span className="badge">{meeting.materialsCount}개 자료</span>
                                </div>
                                <h3 className="meeting-title">{meeting.title}</h3>
                                {meeting.description && (
                                    <p className="meeting-desc">{meeting.description}</p>
                                )}
                                {meeting.presenters.length > 0 && (
                                    <div className="meeting-presenters">
                                        <span className="label">발표자:</span>
                                        <span>{meeting.presenters.map((p) => p.name || '익명').join(', ')}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
