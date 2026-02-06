import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { loginWithGoogle } from '../api/client'
import './LoginPage.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const REDIRECT_URI = 'https://lab-recorder-pwa.vercel.app/login'

export default function LoginPage() {
    const navigate = useNavigate()
    const { isAuthenticated, login } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [status, setStatus] = useState('시작')

    // 인증 상태 확인
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/meetings', { replace: true })
        }
    }, [isAuthenticated, navigate])

    // OAuth 콜백 처리
    useEffect(() => {
        const hash = window.location.hash
        setStatus('해시: ' + (hash ? hash.substring(0, 50) + '...' : '없음'))

        if (hash && hash.includes('id_token')) {
            const params = new URLSearchParams(hash.substring(1))
            const idToken = params.get('id_token')
            if (idToken) {
                window.history.replaceState({}, '', '/login')
                doLogin(idToken)
            }
        } else if (hash && hash.includes('error')) {
            const params = new URLSearchParams(hash.substring(1))
            setError(params.get('error_description') || params.get('error') || '알 수 없는 에러')
        }
    }, [])

    const doLogin = async (idToken: string) => {
        setLoading(true)
        setStatus('로그인 중...')
        try {
            const result = await loginWithGoogle(idToken)
            if (!result.user.isApproved) {
                setError('계정 승인 대기 중')
                setLoading(false)
                return
            }
            login(result.user, result.token)
            navigate('/meetings')
        } catch (err: any) {
            setError(err.message || '로그인 실패')
            setLoading(false)
        }
    }

    const handleGoogleLogin = () => {
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=id_token&scope=openid%20email%20profile&nonce=${Date.now()}`
        window.location.href = url
    }

    return (
        <div className="login-page">
            <div className="logo-area">
                <div className="logo-circle">
                    <img src="/book_icon.png" alt="Lab Recorder" className="logo-icon" />
                </div>
                <h1 className="app-title">Lab Recorder</h1>
                <p className="app-subtitle">발표 녹음 & AI 요약</p>
            </div>

            <div className="login-area">
                {error && <p className="error-message">{error}</p>}

                {loading ? (
                    <div className="loading-area">
                        <div className="spinner" />
                        <p>로그인 중...</p>
                    </div>
                ) : (
                    <button className="google-btn" onClick={handleGoogleLogin}>
                        <span>G</span>
                        <span>Google로 로그인</span>
                    </button>
                )}

                <p className="login-notice">랩 웹사이트 계정으로 로그인하세요</p>

                <p style={{ fontSize: '11px', color: '#999', marginTop: '20px' }}>
                    {status}
                </p>
            </div>

            <p className="version">v1.0.1</p>
        </div>
    )
}
