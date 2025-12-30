'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// Create a new section (Leader only)
export async function createWorkspaceSection(workspaceId: string, name: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    // Check membership (Any member can create section)
    const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: session.user.id } }
    })

    if (!membership && !session.user.isAdmin) {
        return { error: "멤버만 섹션을 추가할 수 있습니다." }
    }

    if (!name.trim()) {
        return { error: "섹션 이름을 입력해주세요." }
    }

    // Get max order
    const maxOrder = await prisma.workspaceSection.aggregate({
        where: { workspaceId },
        _max: { order: true }
    })

    await prisma.workspaceSection.create({
        data: {
            workspaceId,
            name: name.trim(),
            order: (maxOrder._max.order || 0) + 1
        }
    })

    revalidatePath(`/workspaces/${workspaceId}`)
    return { success: true }
}

// Update section name (Leader only)
export async function updateWorkspaceSection(sectionId: string, name: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const section = await prisma.workspaceSection.findUnique({
        where: { id: sectionId }
    })

    if (!section) {
        return { error: "섹션을 찾을 수 없습니다." }
    }

    // Check leader only
    const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: section.workspaceId, userId: session.user.id } }
    })

    if (!membership?.isLeader) {
        return { error: "팀장만 섹션을 수정할 수 있습니다." }
    }

    if (!name.trim()) {
        return { error: "섹션 이름을 입력해주세요." }
    }

    await prisma.workspaceSection.update({
        where: { id: sectionId },
        data: { name: name.trim() }
    })

    revalidatePath(`/workspaces/${section.workspaceId}`)
    return { success: true }
}

// Delete section (Leader only) - Resources become unsectioned
export async function deleteWorkspaceSection(sectionId: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const section = await prisma.workspaceSection.findUnique({
        where: { id: sectionId }
    })

    if (!section) {
        return { error: "섹션을 찾을 수 없습니다." }
    }

    // Check leader only
    const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: section.workspaceId, userId: session.user.id } }
    })

    if (!membership?.isLeader) {
        return { error: "팀장만 섹션을 삭제할 수 있습니다." }
    }

    // Resources will have sectionId set to null due to onDelete: SetNull
    await prisma.workspaceSection.delete({
        where: { id: sectionId }
    })

    revalidatePath(`/workspaces/${section.workspaceId}`)
    return { success: true }
}

// Move resource to a section (any member)
export async function moveResourceToSection(resourceId: string, sectionId: string | null) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const resource = await prisma.workspaceResource.findUnique({
        where: { id: resourceId }
    })

    if (!resource) {
        return { error: "자료를 찾을 수 없습니다." }
    }

    // Check membership
    const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: resource.workspaceId, userId: session.user.id } }
    })

    if (!membership && !session.user.isAdmin) {
        return { error: "멤버만 자료를 이동할 수 있습니다." }
    }

    await prisma.workspaceResource.update({
        where: { id: resourceId },
        data: { sectionId }
    })

    revalidatePath(`/workspaces/${resource.workspaceId}`)
    return { success: true }
}
