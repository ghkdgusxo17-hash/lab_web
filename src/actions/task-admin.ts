'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// Get all members with their task status counts (Admin only)
export async function getMembersWithTaskCounts() {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return []
    }

    const members = await prisma.user.findMany({
        where: { isApproved: true },
        select: {
            id: true,
            name: true,
            image: true,
            _count: {
                select: { tasks: true }
            }
        }
    })

    // Get status counts per member
    type MemberWithCount = typeof members[0]
    const membersWithCounts = await Promise.all(
        members.map(async (member: MemberWithCount) => {
            const statusCounts = await prisma.task.groupBy({
                by: ['status'],
                where: { authorId: member.id },
                _count: { status: true }
            })

            const counts = {
                IN_PROGRESS: 0,
                QUESTION: 0,
                ANSWERED: 0,
                COMPLETED: 0
            }

            statusCounts.forEach((sc: { status: string; _count: { status: number } }) => {
                if (sc.status in counts) {
                    (counts as any)[sc.status] = sc._count.status
                }
            })

            return {
                ...member,
                taskCounts: counts,
                totalTasks: member._count.tasks
            }
        })
    )

    return membersWithCounts
}
