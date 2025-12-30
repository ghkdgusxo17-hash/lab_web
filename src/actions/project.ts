'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// Get all projects
export async function getProjects(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {}

    const projects = await prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    })

    return projects
}

// Get projects with members (for admin)
export async function getProjectsWithMembers() {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return []
    }

    const projects = await prisma.project.findMany({
        include: {
            members: {
                include: {
                    user: {
                        select: { id: true, name: true, image: true }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return projects
}

// Get projects assigned to current user
export async function getAssignedProjects() {
    const session = await auth()

    if (!session?.user?.id) {
        return []
    }

    // Admin sees all active projects
    if (session.user.isAdmin) {
        return prisma.project.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        })
    }

    // Regular user sees only assigned projects
    const projectMembers = await prisma.projectMember.findMany({
        where: { userId: session.user.id },
        include: {
            project: true
        }
    })

    return projectMembers
        .filter((pm: { project: { isActive: boolean } }) => pm.project.isActive)
        .map((pm: { project: any }) => pm.project)
}

// Create project (Admin only)
export async function createProject(formData: FormData) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 과제를 등록할 수 있습니다." }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (!name) {
        return { error: "과제명을 입력해주세요." }
    }

    await prisma.project.create({
        data: {
            name,
            description: description || null
        }
    })

    revalidatePath('/admin')
    revalidatePath('/tasks')
    return { success: true }
}

// Toggle project active status (Admin only)
export async function toggleProjectActive(id: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 수정할 수 있습니다." }
    }

    const project = await prisma.project.findUnique({ where: { id } })

    if (!project) {
        return { error: "과제를 찾을 수 없습니다." }
    }

    await prisma.project.update({
        where: { id },
        data: { isActive: !project.isActive }
    })

    revalidatePath('/admin')
    revalidatePath('/tasks')
    return { success: true }
}

// Assign member to project (Admin only)
export async function assignMemberToProject(projectId: string, userId: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 멤버를 할당할 수 있습니다." }
    }

    // Check if already assigned
    const existing = await prisma.projectMember.findUnique({
        where: {
            projectId_userId: { projectId, userId }
        }
    })

    if (existing) {
        return { error: "이미 할당된 멤버입니다." }
    }

    await prisma.projectMember.create({
        data: { projectId, userId }
    })

    revalidatePath('/admin')
    revalidatePath('/tasks')
    return { success: true }
}

// Remove member from project (Admin only)
export async function removeMemberFromProject(projectId: string, userId: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 멤버를 제거할 수 있습니다." }
    }

    await prisma.projectMember.deleteMany({
        where: { projectId, userId }
    })

    revalidatePath('/admin')
    revalidatePath('/tasks')
    return { success: true }
}

// Delete project (Admin only)
export async function deleteProject(id: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 삭제할 수 있습니다." }
    }

    await prisma.project.delete({
        where: { id }
    })

    revalidatePath('/admin')
    revalidatePath('/tasks')
    return { success: true }
}

