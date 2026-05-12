import { SignJWT, jwtVerify } from 'jose'
import { prisma } from './prisma'
import { NextRequest } from 'next/server'

const JWT_SECRET = new TextEncoder().encode(
    process.env.MOBILE_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key'
)

export interface MobileUser {
    id: string
    name: string | null
    email: string | null
    image: string | null
    isApproved: boolean
    isAdmin: boolean
}

// JWT 토큰 생성
export async function createMobileToken(userId: string): Promise<string> {
    return new SignJWT({ userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(JWT_SECRET)
}

// JWT 토큰 검증
export async function verifyMobileToken(token: string): Promise<{ userId: string } | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return { userId: payload.userId as string }
    } catch {
        return null
    }
}

// Google ID 토큰 검증
export async function verifyGoogleIdToken(idToken: string): Promise<{
    email: string
    name: string
    picture: string
    sub: string
} | null> {
    try {
        // Google의 tokeninfo 엔드포인트로 검증
        const response = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
        )

        if (!response.ok) {
            console.error('Google token verification failed:', response.status)
            return null
        }

        const payload = await response.json()

        // 클라이언트 ID 확인 (선택적)
        const validClientIds = [
            process.env.GOOGLE_CLIENT_ID,
            process.env.MOBILE_GOOGLE_CLIENT_ID,
        ].filter(Boolean)

        if (validClientIds.length > 0 && !validClientIds.includes(payload.aud)) {
            console.error('Invalid Google client ID:', payload.aud)
            return null
        }

        return {
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            sub: payload.sub,
        }
    } catch (error) {
        console.error('Google token verification error:', error)
        return null
    }
}

// 요청에서 사용자 가져오기
export async function getMobileUser(request: NextRequest): Promise<MobileUser | null> {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        return null
    }

    const token = authHeader.slice(7)
    const payload = await verifyMobileToken(token)
    if (!payload) {
        return null
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isApproved: true,
            isAdmin: true,
        },
    })

    return user
}

// 인증 필수 래퍼
export async function requireMobileAuth(request: NextRequest): Promise<MobileUser> {
    const user = await getMobileUser(request)
    if (!user) {
        throw new Error('Unauthorized')
    }
    if (!user.isApproved) {
        throw new Error('Account not approved')
    }
    return user
}
