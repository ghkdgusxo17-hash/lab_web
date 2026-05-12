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

        const meeting = await prisma.labMeeting.findUnique({
            where: { id },
            include: {
                materials: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        uploader: {
                            select: { id: true, name: true }
                        },
                        presenter: {
                            select: { id: true, name: true }
                        },
                        transcription: {
                            select: {
                                id: true,
                                status: true,
                                summary: true,
                            }
                        }
                    }
                },
            },
        })

        if (!meeting) {
            return NextResponse.json(
                { error: 'Meeting not found' },
                { status: 404 }
            )
        }

        // 발표자 목록 추출
        const presenterMap = new Map<string, { id: string; name: string | null; image: string | null }>()
        meeting.materials.forEach(m => {
            if (m.presenter) {
                presenterMap.set(m.presenter.id, { ...m.presenter, image: null })
            }
        })

        const formattedMeeting = {
            id: meeting.id,
            date: meeting.date.toISOString(),
            title: meeting.title,
            description: meeting.description,
            presenters: Array.from(presenterMap.values()),
            materialsCount: meeting.materials.length,
            materials: meeting.materials.map(m => ({
                id: m.id,
                title: m.title,
                description: m.description,
                category: m.category,
                filename: m.filename,
                url: m.url,
                uploader: m.uploader,
                presenter: m.presenter,
                transcription: m.transcription,
                createdAt: m.createdAt.toISOString(),
            })),
        }

        return NextResponse.json({ meeting: formattedMeeting })
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (error.message === 'Account not approved') {
            return NextResponse.json({ error: 'Account not approved' }, { status: 403 })
        }
        console.error('Get meeting error:', error)
        return NextResponse.json(
            { error: 'Failed to get meeting' },
            { status: 500 }
        )
    }
}
