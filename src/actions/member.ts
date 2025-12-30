'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// Get all members grouped by role
export async function getMembers() {
    const members = await prisma.user.findMany({
        where: {
            isApproved: true,
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
