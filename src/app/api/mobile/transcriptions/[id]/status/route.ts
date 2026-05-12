import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireMobileAuth } from '@/lib/mobile-auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireMobileAuth(request)

        const { id } = await params

        const transcription = await prisma.meetingTranscription.findUnique({
            where: { id },
            select: {
                id: true,
                status: true,
                error: true,
            },
        })

        if (!transcription) {
            return NextResponse.json(
                { error: 'Transcription not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(transcription)
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (error.message === 'Account not approved') {
            return NextResponse.json({ error: 'Account not approved' }, { status: 403 })
        }
        console.error('Get transcription status error:', error)
        return NextResponse.json(
            { error: 'Failed to get status' },
            { status: 500 }
        )
    }
}
