import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyGoogleIdToken, createMobileToken } from '@/lib/mobile-auth'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { idToken } = body

        if (!idToken) {
            return NextResponse.json(
                { error: 'ID token is required' },
                { status: 400 }
            )
        }

        // Google ID 토큰 검증
        const googleUser = await verifyGoogleIdToken(idToken)
        if (!googleUser) {
            return NextResponse.json(
                { error: 'Invalid Google token' },
                { status: 401 }
            )
        }

        // 기존 사용자 찾기 또는 생성
        let user = await prisma.user.findUnique({
            where: { email: googleUser.email },
        })

        if (!user) {
            // 새 사용자 생성 (Google 계정 연동)
            user = await prisma.user.create({
                data: {
                    email: googleUser.email,
                    name: googleUser.name,
                    image: googleUser.picture,
                    isApproved: false, // 관리자 승인 필요
                    isAdmin: false,
                },
            })

            // Account 연결 (NextAuth 호환)
            await prisma.account.create({
                data: {
                    userId: user.id,
                    type: 'oauth',
                    provider: 'google',
                    providerAccountId: googleUser.sub,
                },
            })
        } else {
            // 기존 사용자 정보 업데이트
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    name: googleUser.name || user.name,
                    image: googleUser.picture || user.image,
                },
            })
        }

        // 모바일용 JWT 토큰 생성
        const token = await createMobileToken(user.id)

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                isApproved: user.isApproved,
                isAdmin: user.isAdmin,
            },
            token,
        })
    } catch (error) {
        console.error('Mobile login error:', error)
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        )
    }
}
