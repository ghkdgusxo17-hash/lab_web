'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getMedalTier } from "@/lib/medal"

// Get all members grouped by role (excluding alumni)
export async function getMembers() {
    const members = await prisma.user.findMany({
        where: {
            isApproved: true,
            role: { not: 'ALUMNI' },
        },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            bio: true,
            researchInterests: true,
            graduatedAt: true,
            medalPoints: true,
        },
        orderBy: { name: 'asc' },
    })

    return members
}

// Get alumni members
export async function getAlumni() {
    const alumni = await prisma.user.findMany({
        where: {
            isApproved: true,
            role: 'ALUMNI',
        },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            bio: true,
            graduatedAt: true,
            currentCompany: true,
            currentPosition: true,
            degreeObtained: true,
            medalPoints: true,
        },
        orderBy: { graduatedAt: 'desc' },
    })

    return alumni
}

// Check if alumni section should be visible
export async function getAlumniVisibility() {
    const session = await auth()

    // Members always see alumni
    if (session?.user?.isApproved || session?.user?.isAdmin) {
        return true
    }

    // For non-members, check site settings
    const settings = await prisma.siteSettings.findUnique({
        where: { id: 'main' },
        select: { alumniVisible: true },
    })

    return settings?.alumniVisible ?? false
}

// Toggle alumni visibility (Admin only)
export async function toggleAlumniVisibility() {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: '권한이 없습니다.' }
    }

    const settings = await prisma.siteSettings.findUnique({
        where: { id: 'main' },
    })

    if (!settings) {
        await prisma.siteSettings.create({
            data: { id: 'main', alumniVisible: true },
        })
    } else {
        await prisma.siteSettings.update({
            where: { id: 'main' },
            data: { alumniVisible: !settings.alumniVisible },
        })
    }

    return { success: true }
}

// Get current alumni visibility setting
export async function getAlumniVisibilitySetting() {
    const settings = await prisma.siteSettings.findUnique({
        where: { id: 'main' },
        select: { alumniVisible: true },
    })

    return settings?.alumniVisible ?? false
}

// Get members that can be invited to workspaces (approved OR admin)
// Requires login but not admin
export async function getInvitableMembers() {
    const session = await auth()

    if (!session?.user) {
        return []
    }

    const members = await prisma.user.findMany({
        where: {
            OR: [
                { isApproved: true },
                { isAdmin: true }
            ]
        },
        select: {
            id: true,
            name: true,
            image: true,
            isAdmin: true,
        },
        orderBy: { name: 'asc' },
    })

    return members
}

// Check if current user is admin
export async function isCurrentUserAdmin() {
    const session = await auth()
    return session?.user?.isAdmin || false
}

// Get member profile with activity stats
export async function getMemberProfile(id: string) {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            bio: true,
            researchInterests: true,
            medalPoints: true,
            joinedAt: true,
        },
    })

    if (!user) return null

    // 활동 통계 병렬 조회
    const [presentationCount, mvpCount, postCount, taskStats] = await Promise.all([
        // 랩미팅 발표 횟수 (자료별 발표자)
        prisma.material.count({
            where: { presenterId: id, labMeetingId: { not: null } },
        }),
        // MVP 수상 횟수
        prisma.medalAward.count({
            where: { recipientId: id },
        }),
        // 게시글 수
        prisma.post.count({
            where: { authorId: id },
        }),
        // 작업 통계
        prisma.task.groupBy({
            by: ['status'],
            where: { authorId: id },
            _count: true,
        }),
    ])

    const totalTasks = taskStats.reduce((sum, s) => sum + s._count, 0)
    const completedTasks = taskStats.find(s => s.status === 'COMPLETED')?._count || 0

    // 랩미팅 발표 이력
    const presentations = await prisma.material.findMany({
        where: { presenterId: id, labMeetingId: { not: null } },
        select: {
            id: true,
            title: true,
            createdAt: true,
            labMeeting: {
                select: {
                    id: true,
                    title: true,
                    date: true,
                    medalAwards: {
                        where: { recipientId: id },
                        select: { id: true, type: true },
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    // 훈장 진행 상태
    const tier = getMedalTier(user.medalPoints)
    let nextTierInfo = null
    if (!tier) {
        nextTierInfo = { name: '동훈장', pointsNeeded: 1, current: 0 }
    } else if (tier.level === 1) {
        nextTierInfo = { name: '은훈장', pointsNeeded: 4 - user.medalPoints, current: user.medalPoints }
    } else if (tier.level === 2) {
        nextTierInfo = { name: '금훈장', pointsNeeded: 7 - user.medalPoints, current: user.medalPoints }
    } else if (tier.level === 3) {
        nextTierInfo = { name: '명예훈장', pointsNeeded: 10 - user.medalPoints, current: user.medalPoints }
    }

    return {
        ...user,
        stats: {
            presentationCount,
            mvpCount,
            postCount,
            totalTasks,
            completedTasks,
        },
        presentations,
        nextTierInfo,
    }
}
