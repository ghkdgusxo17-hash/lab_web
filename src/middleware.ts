import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// CORS 허용 도메인
const allowedOrigins = [
    'https://lab-recorder-pwa.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
]

export function middleware(request: NextRequest) {
    const origin = request.headers.get('origin')
    const pathname = request.nextUrl.pathname

    // /api/mobile/* 경로에만 CORS 적용
    if (pathname.startsWith('/api/mobile')) {
        // Preflight 요청 처리 (OPTIONS)
        if (request.method === 'OPTIONS') {
            const response = new NextResponse(null, { status: 200 })

            if (origin && allowedOrigins.includes(origin)) {
                response.headers.set('Access-Control-Allow-Origin', origin)
            }
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            response.headers.set('Access-Control-Max-Age', '86400')

            return response
        }

        // 일반 요청에 CORS 헤더 추가
        const response = NextResponse.next()

        if (origin && allowedOrigins.includes(origin)) {
            response.headers.set('Access-Control-Allow-Origin', origin)
        }
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        return response
    }

    return NextResponse.next()
}

export const config = {
    matcher: '/api/mobile/:path*',
}
