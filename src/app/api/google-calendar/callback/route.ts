import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/google-calendar/callback
 * Handles Google OAuth callback for calendar scope.
 * Stores calendar tokens in the Account table.
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // userId
    const error = searchParams.get('error')

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    if (error) {
        console.error('[Google Calendar] OAuth error:', error)
        return NextResponse.redirect(
            `${baseUrl}/settings?calendar_error=${encodeURIComponent('Google Calendar 연동이 취소되었습니다.')}`
        )
    }

    if (!code || !state) {
        return NextResponse.redirect(
            `${baseUrl}/settings?calendar_error=${encodeURIComponent('잘못된 요청입니다.')}`
        )
    }

    const userId = state

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
        return NextResponse.redirect(
            `${baseUrl}/settings?calendar_error=${encodeURIComponent('사용자를 찾을 수 없습니다.')}`
        )
    }

    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${baseUrl}/api/google-calendar/callback`
    )

    try {
        const { tokens } = await oauth2Client.getToken(code)

        // Find existing Google account for this user
        const existingAccount = await prisma.account.findFirst({
            where: { userId, provider: 'google' },
        })

        if (existingAccount) {
            // Update existing account with new calendar tokens and scope
            const currentScope = existingAccount.scope || ''
            const calendarScope = 'https://www.googleapis.com/auth/calendar.readonly'
            const newScope = currentScope.includes(calendarScope)
                ? currentScope
                : `${currentScope} ${calendarScope}`.trim()

            await prisma.account.update({
                where: { id: existingAccount.id },
                data: {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token || existingAccount.refresh_token,
                    expires_at: tokens.expiry_date
                        ? Math.floor(tokens.expiry_date / 1000)
                        : existingAccount.expires_at,
                    scope: newScope,
                },
            })
        } else {
            // No Google account linked - create a minimal one for calendar only
            // This handles Credentials login users who want calendar
            await prisma.account.create({
                data: {
                    userId,
                    type: 'oauth',
                    provider: 'google-calendar',
                    providerAccountId: `calendar_${userId}`,
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expires_at: tokens.expiry_date
                        ? Math.floor(tokens.expiry_date / 1000)
                        : null,
                    scope: 'https://www.googleapis.com/auth/calendar.readonly',
                },
            })
        }

        return NextResponse.redirect(`${baseUrl}/settings?calendar_success=true`)
    } catch (err) {
        console.error('[Google Calendar] Token exchange failed:', err)
        return NextResponse.redirect(
            `${baseUrl}/settings?calendar_error=${encodeURIComponent('토큰 교환에 실패했습니다. 다시 시도해주세요.')}`
        )
    }
}
