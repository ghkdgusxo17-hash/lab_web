import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// API 기본 URL - 환경에 따라 변경
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Axios 인스턴스 생성
export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// 요청 인터셉터 - 토큰 추가
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // 토큰 만료 시 로그아웃
            useAuthStore.getState().logout()
            window.location.href = '/'
        }
        return Promise.reject(error)
    }
)

// ========== 타입 정의 ==========

export interface User {
    id: string
    name: string | null
    email: string | null
    image: string | null
    isApproved: boolean
    isAdmin: boolean
}

export interface LabMeeting {
    id: string
    date: string
    title: string
    description: string | null
    presenters: { id: string; name: string | null; image: string | null }[]
    materialsCount: number
}

export interface Material {
    id: string
    title: string
    description: string | null
    category: string
    filename: string
    url: string
    uploader: { id: string; name: string | null }
    presenter: { id: string; name: string | null } | null
    transcription: {
        id: string
        status: string
        summary: string | null
    } | null
    createdAt: string
}

export interface LabMeetingDetail extends LabMeeting {
    materials: Material[]
}

export interface Transcription {
    id: string
    status: string
    audioUrl: string
    audioFilename: string | null
    summary: string | null
    transcript: string | null
    error: string | null
    material: {
        id: string
        title: string
        labMeeting: { id: string; date: string; title: string } | null
    }
    recorder: { id: string; name: string | null }
    createdAt: string
}

// ========== API 함수 ==========

// 인증
export async function loginWithGoogle(idToken: string): Promise<{ user: User; token: string }> {
    const response = await api.post('/api/mobile/auth/login', { idToken })
    return response.data
}

export async function getCurrentUser(): Promise<User> {
    const response = await api.get('/api/mobile/auth/me')
    return response.data.user
}

// 랩미팅
export async function getLabMeetings(): Promise<LabMeeting[]> {
    const response = await api.get('/api/mobile/lab-meetings')
    return response.data.meetings
}

export async function getLabMeeting(id: string): Promise<LabMeetingDetail> {
    const response = await api.get(`/api/mobile/lab-meetings/${id}`)
    return response.data.meeting
}

// 트랜스크립션
export async function uploadTranscription(
    materialId: string,
    audioBlob: Blob,
    filename: string
): Promise<{ transcriptionId: string }> {
    const formData = new FormData()
    formData.append('materialId', materialId)
    formData.append('audioFile', audioBlob, filename)

    const response = await api.post('/api/mobile/transcriptions', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5분 타임아웃
    })
    return response.data
}

export async function getTranscriptionStatus(id: string): Promise<{
    id: string
    status: string
    error: string | null
}> {
    const response = await api.get(`/api/mobile/transcriptions/${id}/status`)
    return response.data
}

export async function getTranscription(id: string): Promise<Transcription> {
    const response = await api.get(`/api/mobile/transcriptions/${id}`)
    return response.data
}

// 멤버 목록 (발표자 선택용)
export async function getMembers(): Promise<{ id: string; name: string | null; role: string }[]> {
    const response = await api.get('/api/mobile/members')
    return response.data.members
}
