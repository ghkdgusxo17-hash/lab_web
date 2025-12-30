'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// Get my workspaces (where I'm a member)
export async function getMyWorkspaces() {
    const session = await auth()

    if (!session?.user) {
        return []
    }

    const memberships = await prisma.workspaceMember.findMany({
        where: { userId: session.user.id },
        include: {
            workspace: {
                include: {
                    members: {
                        include: {
                            user: { select: { id: true, name: true, image: true } }
                        }
                    },
                    _count: { select: { resources: true } }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return memberships.map((m: any) => ({
        ...m.workspace,
        isLeader: m.isLeader,
        isMember: true
    }))
}

// Get all workspaces (public list)
export async function getAllWorkspaces() {
    const session = await auth()
    const userId = session?.user?.id

    const workspaces = await prisma.workspace.findMany({
        include: {
            members: {
                include: {
                    user: { select: { id: true, name: true, image: true } }
                }
            },
            _count: { select: { resources: true } }
        },
        orderBy: { createdAt: 'desc' }
    })

    return workspaces.map((w: any) => {
        const myMembership = userId ? w.members.find((m: any) => m.userId === userId) : null
        return {
            ...w,
            isLeader: myMembership?.isLeader || false,
            isMember: !!myMembership
        }
    })
}

// Get single workspace with members and resources
// Public access but resources only visible to members
export async function getWorkspace(id: string) {
    const session = await auth()

    // Check membership if logged in
    let membership = null
    if (session?.user) {
        membership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: { workspaceId: id, userId: session.user.id }
            }
        })
    }

    const isMember = !!membership
    const isAdmin = session?.user?.isAdmin || false

    const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: {
            members: {
                include: {
                    user: { select: { id: true, name: true, image: true, email: true } }
                },
                orderBy: [{ isLeader: 'desc' }, { createdAt: 'asc' }]
            },
            // Include sections with their resources
            sections: (isMember || isAdmin) ? {
                include: {
                    resources: {
                        include: {
                            uploader: { select: { id: true, name: true, image: true } }
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                },
                orderBy: { order: 'asc' }
            } : false,
            // Also include unsectioned resources
            resources: (isMember || isAdmin) ? {
                where: { sectionId: null },
                include: {
                    uploader: { select: { id: true, name: true, image: true } },
                    section: { select: { id: true, name: true } }
                },
                orderBy: { createdAt: 'desc' }
            } : false
        }
    })

    if (!workspace) return null

    return {
        ...workspace,
        sections: (isMember || isAdmin) ? workspace.sections : [],
        resources: (isMember || isAdmin) ? workspace.resources : [],
        isLeader: membership?.isLeader || false,
        isMember,
        isAdmin,
        canViewResources: isMember || isAdmin
    }
}

// Create workspace (Approved members only)
export async function createWorkspace(formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "승인된 멤버만 협업공간을 생성할 수 있습니다." }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (!name) {
        return { error: "협업공간 이름을 입력해주세요." }
    }

    const workspace = await prisma.workspace.create({
        data: {
            name,
            description: description || null,
            members: {
                create: {
                    userId: session.user.id,
                    isLeader: true
                }
            }
        }
    })

    revalidatePath('/workspaces')
    redirect(`/workspaces/${workspace.id}`)
}

// Update workspace (Leader only)
export async function updateWorkspace(id: string, formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    // Check leader
    const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: id, userId: session.user.id } }
    })

    if (!membership?.isLeader && !session.user.isAdmin) {
        return { error: "팀장만 수정할 수 있습니다." }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string

    await prisma.workspace.update({
        where: { id },
        data: { name, description: description || null }
    })

    revalidatePath(`/workspaces/${id}`)
    return { success: true }
}

// Delete workspace (Leader only)
export async function deleteWorkspace(id: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    // Check leader
    const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: id, userId: session.user.id } }
    })

    if (!membership?.isLeader && !session.user.isAdmin) {
        return { error: "팀장만 삭제할 수 있습니다." }
    }

    await prisma.workspace.delete({ where: { id } })

    revalidatePath('/workspaces')
    return { success: true }
}

// Add member (Any member can invite)
export async function addWorkspaceMember(workspaceId: string, userId: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    // Check if requester is a member (any member can invite)
    const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: session.user.id } }
    })

    if (!membership && !session.user.isAdmin) {
        return { error: "멤버만 다른 사람을 초대할 수 있습니다." }
    }

    // Check if already member
    const existing = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } }
    })

    if (existing) {
        return { error: "이미 멤버입니다." }
    }

    await prisma.workspaceMember.create({
        data: { workspaceId, userId }
    })

    revalidatePath(`/workspaces/${workspaceId}`)
    return { success: true }
}

// Remove member (Leader only)
export async function removeWorkspaceMember(workspaceId: string, userId: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    // Check leader
    const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: session.user.id } }
    })

    if (!membership?.isLeader && !session.user.isAdmin) {
        return { error: "팀장만 멤버를 제거할 수 있습니다." }
    }

    // Cannot remove self if leader
    if (userId === session.user.id && membership?.isLeader) {
        return { error: "팀장은 자신을 제거할 수 없습니다." }
    }

    await prisma.workspaceMember.delete({
        where: { workspaceId_userId: { workspaceId, userId } }
    })

    revalidatePath(`/workspaces/${workspaceId}`)
    return { success: true }
}

// Leave workspace
export async function leaveWorkspace(workspaceId: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: session.user.id } }
    })

    if (!membership) {
        return { error: "멤버가 아닙니다." }
    }

    if (membership.isLeader) {
        return { error: "팀장은 나갈 수 없습니다. 다른 멤버에게 팀장을 위임하세요." }
    }

    await prisma.workspaceMember.delete({
        where: { workspaceId_userId: { workspaceId, userId: session.user.id } }
    })

    revalidatePath('/workspaces')
    return { success: true }
}

// Transfer leadership (Admin only)
export async function transferLeadership(workspaceId: string, newLeaderId: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    // Admin only
    if (!session.user.isAdmin) {
        return { error: "관리자만 팀장을 지정할 수 있습니다." }
    }

    // Check new leader is member
    const newLeaderMembership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: newLeaderId } }
    })

    if (!newLeaderMembership) {
        return { error: "해당 사용자는 멤버가 아닙니다." }
    }

    // If already the only leader, do nothing
    if (newLeaderMembership.isLeader) {
        // Still demote any other leaders (cleanup)
        await prisma.workspaceMember.updateMany({
            where: { workspaceId, isLeader: true, userId: { not: newLeaderId } },
            data: { isLeader: false }
        })
        revalidatePath(`/workspaces/${workspaceId}`)
        revalidatePath('/admin')
        return { success: true }
    }

    // Demote ALL current leaders and promote new leader
    await prisma.$transaction([
        prisma.workspaceMember.updateMany({
            where: { workspaceId, isLeader: true },
            data: { isLeader: false }
        }),
        prisma.workspaceMember.update({
            where: { workspaceId_userId: { workspaceId, userId: newLeaderId } },
            data: { isLeader: true }
        })
    ])

    revalidatePath(`/workspaces/${workspaceId}`)
    revalidatePath('/admin')
    return { success: true }
}
