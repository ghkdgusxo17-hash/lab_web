import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireMobileAuth } from '@/lib/mobile-auth'

export async function GET(request: NextRequest) {
    try {
        await requireMobileAuth(request)

        const members = await prisma.user.findMany({
            where: { isApproved: true },
            select: {
                id: true,
                name: true,
                role: true,
            },
            orderBy: { name: 'asc' },
        })

        return NextResponse.json({ members })
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (error.message === 'Account not approved') {
            return NextResponse.json({ error: 'Account not approved' }, { status: 403 })
        }
        console.error('Get members error:', error)
        return NextResponse.json(
            { error: 'Failed to get members' },
            { status: 500 }
        )
    }
}
