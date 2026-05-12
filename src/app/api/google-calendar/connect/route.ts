import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

/**
 * GET /api/google-calendar/connect
 * Redirects to Google OAuth with calendar.readonly scope.
 * Separate from the main login flow.
 */
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL))
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXTAUTH_URL}/api/google-calendar/callback`
    )

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/calendar.readonly',
        ],
        state: session.user.id, // Pass userId to callback
    })

    return NextResponse.redirect(authUrl)
}
