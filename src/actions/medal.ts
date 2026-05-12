'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { getMedalPoints } from '@/lib/medal'

// Award medal (Admin only)
export async function awardMedal(recipientId: string, labMeetingId: string, type: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: '관리자만 훈장을 수여할 수 있습니다.' }
    }

    if (type !== 'MVP') {
        return { error: '유효하지 않은 훈장 유형입니다.' }
    }

    const points = getMedalPoints(type)

    try {
        // 이미 해당 미팅에서 수상한 사람인지 체크
        const existingAward = await prisma.medalAward.findUnique({
            where: { labMeetingId_recipientId: { labMeetingId, recipientId } },
        })
        if (existingAward) {
            return { error: '이미 이 미팅에서 훈장을 받은 사용자입니다.' }
        }

        await prisma.$transaction([
            prisma.medalAward.create({
                data: {
                    type,
                    recipientId,
                    awarderId: session.user.id,
                    labMeetingId,
                },
            }),
            prisma.user.update({
                where: { id: recipientId },
                data: { medalPoints: { increment: points } },
            }),
        ])

        revalidatePath(`/materials/lab-meeting/${labMeetingId}`)
        revalidatePath('/members')
        return { success: true }
    } catch (error) {
        console.error('Award medal error:', error)
        return { error: '훈장 수여 중 오류가 발생했습니다.' }
    }
}

// Revoke medal (Admin only)
export async function revokeMedal(awardId: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: '관리자만 훈장을 회수할 수 있습니다.' }
    }

    try {
        const award = await prisma.medalAward.findUnique({
            where: { id: awardId },
        })

        if (!award) {
            return { error: '훈장을 찾을 수 없습니다.' }
        }

        const points = getMedalPoints(award.type)

        await prisma.$transaction([
            prisma.medalAward.delete({
                where: { id: awardId },
            }),
            prisma.user.update({
                where: { id: award.recipientId },
                data: { medalPoints: { decrement: points } },
            }),
        ])

        revalidatePath(`/materials/lab-meeting/${award.labMeetingId}`)
        revalidatePath('/members')
        return { success: true }
    } catch (error) {
        console.error('Revoke medal error:', error)
        return { error: '훈장 회수 중 오류가 발생했습니다.' }
    }
}

// Get medal awards for a specific meeting
export async function getMedalAwardsForMeeting(labMeetingId: string) {
    const awards = await prisma.medalAward.findMany({
        where: { labMeetingId },
        include: {
            recipient: {
                select: { id: true, name: true, image: true },
            },
            awarder: {
                select: { id: true, name: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    return awards
}
