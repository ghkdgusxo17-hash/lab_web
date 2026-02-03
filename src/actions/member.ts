'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

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
