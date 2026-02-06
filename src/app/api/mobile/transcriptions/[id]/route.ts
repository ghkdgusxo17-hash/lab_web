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
            include: {
                material: {
                    select: {
                        id: true,
                        title: true,
                        labMeeting: {
                            select: {
                                id: true,
                                date: true,
                                title: true,
                            }
                        }
                    }
                },
                recorder: {
                    select: { id: true, name: true }
                },
            },
        })

        if (!transcription) {
            return NextResponse.json(
                { error: 'Transcription not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            id: transcription.id,
            status: transcription.status,
            audioUrl: transcription.audioUrl,
            audioFilename: transcription.audioFilename,
            summary: transcription.summary,
            transcript: transcription.transcript,
            error: transcription.error,
            material: {
                id: transcription.material.id,
                title: transcription.material.title,
                labMeeting: transcription.material.labMeeting ? {
                    id: transcription.material.labMeeting.id,
                    date: transcription.material.labMeeting.date.toISOString(),
                    title: transcription.material.labMeeting.title,
                } : null,
            },
            recorder: transcription.recorder,
            createdAt: transcription.createdAt.toISOString(),
        })
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (error.message === 'Account not approved') {
            return NextResponse.json({ error: 'Account not approved' }, { status: 403 })
        }
        console.error('Get transcription error:', error)
        return NextResponse.json(
            { error: 'Failed to get transcription' },
            { status: 500 }
        )
    }
}
