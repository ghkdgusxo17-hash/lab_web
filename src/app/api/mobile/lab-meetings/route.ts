import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireMobileAuth } from '@/lib/mobile-auth'

export async function GET(request: NextRequest) {
    try {
        await requireMobileAuth(request)

        const meetings = await prisma.labMeeting.findMany({
            orderBy: { date: 'desc' },
            include: {
                materials: {
                    select: {
                        presenter: {
                            select: { id: true, name: true, image: true }
                        }
                    }
                },
                _count: {
                    select: { materials: true }
                }
            },
        })

        const formattedMeetings = meetings.map(meeting => {
            // 발표자 목록 추출 (중복 제거)
            const presenterMap = new Map<string, { id: string; name: string | null; image: string | null }>()
            meeting.materials.forEach(m => {
                if (m.presenter) {
                    presenterMap.set(m.presenter.id, m.presenter)
                }
            })

            return {
                id: meeting.id,
                date: meeting.date.toISOString(),
                title: meeting.title,
                description: meeting.description,
                presenters: Array.from(presenterMap.values()),
                materialsCount: meeting._count.materials,
            }
        })

        return NextResponse.json({ meetings: formattedMeetings })
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (error.message === 'Account not approved') {
            return NextResponse.json({ error: 'Account not approved' }, { status: 403 })
        }
        console.error('Get meetings error:', error)
        return NextResponse.json(
            { error: 'Failed to get meetings' },
            { status: 500 }
        )
    }
}
