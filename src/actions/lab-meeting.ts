'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { STORAGE_BUCKET, getProxyUrl, extractStoragePath } from '@/lib/storage-constants'

// Get all lab meetings (ordered by date desc)
export async function getLabMeetings() {
    const meetings = await prisma.labMeeting.findMany({
        include: {
            presenters: {
                include: {
                    user: {
                        select: { id: true, name: true, image: true, medalPoints: true }
                    }
                }
            },
            _count: {
                select: { materials: true }
            }
        },
        orderBy: { date: 'desc' }
    })

    return meetings.map(meeting => ({
        ...meeting,
        presenters: meeting.presenters.map(p => p.user),
        materialsCount: meeting._count.materials
    }))
}

// Get single lab meeting with materials
export async function getLabMeeting(id: string) {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    const meeting = await prisma.labMeeting.findUnique({
        where: { id },
        include: {
            presenters: {
                include: {
                    user: {
                        select: { id: true, name: true, image: true, medalPoints: true }
                    }
                }
            },
            medalAwards: {
                include: {
                    recipient: {
                        select: { id: true, name: true, image: true }
                    },
                    awarder: {
                        select: { id: true, name: true }
                    }
                }
            },
            materials: {
                include: {
                    uploader: {
                        select: { id: true, name: true, image: true, medalPoints: true }
                    },
                    presenter: {
                        select: { id: true, name: true, image: true }
                    },
                    transcription: {
                        select: {
                            id: true,
                            status: true,
                            summary: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!meeting) return null

    return {
        ...meeting,
        presenters: meeting.presenters.map(p => p.user)
    }
}

// Create lab meeting (Admin or Approved members)
export async function createLabMeeting(formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "승인된 멤버만 랩미팅을 생성할 수 있습니다." }
    }

    const date = formData.get('date') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const presenterIds = formData.getAll('presenterIds') as string[]

    if (!date || !title) {
        return { error: "날짜와 제목을 입력해주세요." }
    }

    try {
        const meeting = await prisma.labMeeting.create({
            data: {
                date: new Date(date),
                title,
                description: description || null,
                presenters: {
                    create: presenterIds.map(userId => ({ userId }))
                }
            }
        })

        revalidatePath('/materials/lab-meeting')
        return { success: true, id: meeting.id }
    } catch (error) {
        console.error('Create lab meeting error:', error)
        return { error: "랩미팅 생성 중 오류가 발생했습니다." }
    }
}

// Update lab meeting (Admin or Approved members)
export async function updateLabMeeting(id: string, formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "수정 권한이 없습니다." }
    }

    const date = formData.get('date') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const presenterIds = formData.getAll('presenterIds') as string[]

    if (!date || !title) {
        return { error: "날짜와 제목을 입력해주세요." }
    }

    try {
        // Update meeting and replace presenters
        await prisma.$transaction(async (tx) => {
            // Delete existing presenters
            await tx.labMeetingPresenter.deleteMany({
                where: { labMeetingId: id }
            })

            // Update meeting with new presenters
            await tx.labMeeting.update({
                where: { id },
                data: {
                    date: new Date(date),
                    title,
                    description: description || null,
                    presenters: {
                        create: presenterIds.map(userId => ({ userId }))
                    }
                }
            })
        })

        revalidatePath('/materials/lab-meeting')
        revalidatePath(`/materials/lab-meeting/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Update lab meeting error:', error)
        return { error: "랩미팅 수정 중 오류가 발생했습니다." }
    }
}

// Delete lab meeting (Admin only)
export async function deleteLabMeeting(id: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    if (!session.user.isAdmin) {
        return { error: "관리자만 삭제할 수 있습니다." }
    }

    try {
        // Delete associated materials from storage
        const materials = await prisma.material.findMany({
            where: { labMeetingId: id }
        })

        for (const material of materials) {
            const storagePath = extractStoragePath(material.url)
            if (storagePath) {
                await supabaseAdmin.storage
                    .from(STORAGE_BUCKET)
                    .remove([storagePath])
            }
        }

        // Delete meeting (cascade deletes materials link)
        await prisma.labMeeting.delete({
            where: { id }
        })

        revalidatePath('/materials/lab-meeting')
        return { success: true }
    } catch (error) {
        console.error('Delete lab meeting error:', error)
        return { error: "랩미팅 삭제 중 오류가 발생했습니다." }
    }
}

// Upload material to lab meeting
export async function uploadLabMeetingMaterial(labMeetingId: string, formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "승인된 멤버만 자료를 업로드할 수 있습니다." }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string || 'PPT'
    const file = formData.get('file') as File

    if (!title || !file) {
        return { error: "제목과 파일을 입력해주세요." }
    }

    try {
        // Generate unique filename
        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filename = `${timestamp}_${safeName}`
        const filePath = `lab-meeting/${filename}`

        // Upload to Supabase Storage
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const { error: uploadError } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true,
            })

        if (uploadError) {
            console.error('Supabase upload error:', uploadError)
            return { error: "파일 업로드 중 오류가 발생했습니다." }
        }

        // Create database record
        await prisma.material.create({
            data: {
                title,
                description: description || null,
                category,
                filename: file.name,
                url: getProxyUrl(filePath),
                size: file.size,
                mimeType: file.type,
                uploaderId: session.user.id,
                labMeetingId
            }
        })

        revalidatePath(`/materials/lab-meeting/${labMeetingId}`)
        return { success: true }
    } catch (error) {
        console.error('Upload error:', error)
        return { error: "파일 업로드 중 오류가 발생했습니다." }
    }
}

// Delete material from lab meeting
export async function deleteLabMeetingMaterial(materialId: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const material = await prisma.material.findUnique({
        where: { id: materialId }
    })

    if (!material) {
        return { error: "자료를 찾을 수 없습니다." }
    }

    // Only uploader or admin can delete
    if (material.uploaderId !== session.user.id && !session.user.isAdmin) {
        return { error: "삭제 권한이 없습니다." }
    }

    try {
        // Delete from Supabase Storage
        const storagePath = extractStoragePath(material.url)
        if (storagePath) {
            await supabaseAdmin.storage
                .from(STORAGE_BUCKET)
                .remove([storagePath])
        }

        // Delete database record
        await prisma.material.delete({
            where: { id: materialId }
        })

        if (material.labMeetingId) {
            revalidatePath(`/materials/lab-meeting/${material.labMeetingId}`)
        }
        return { success: true }
    } catch (error) {
        console.error('Delete error:', error)
        return { error: "삭제 중 오류가 발생했습니다." }
    }
}

// Get year stats for folder navigation
export async function getLabMeetingYearStats() {
    const meetings = await prisma.labMeeting.findMany({
        include: {
            presenters: {
                include: {
                    user: { select: { id: true, name: true } }
                }
            },
            _count: { select: { materials: true } }
        },
        orderBy: { date: 'desc' }
    })

    // Group by year
    const yearMap = new Map<number, {
        meetingCount: number
        materialsCount: number
        presenterIds: Set<string>
        monthsWithMeetings: Set<number>
    }>()

    for (const m of meetings) {
        const year = new Date(m.date).getFullYear()
        const month = new Date(m.date).getMonth() + 1
        if (!yearMap.has(year)) {
            yearMap.set(year, {
                meetingCount: 0,
                materialsCount: 0,
                presenterIds: new Set(),
                monthsWithMeetings: new Set()
            })
        }
        const stats = yearMap.get(year)!
        stats.meetingCount++
        stats.materialsCount += m._count.materials
        stats.monthsWithMeetings.add(month)
        for (const p of m.presenters) {
            stats.presenterIds.add(p.userId)
        }
    }

    // Get MVP per year using MedalAward
    const allAwards = await prisma.medalAward.findMany({
        include: {
            recipient: { select: { id: true, name: true } },
            labMeeting: { select: { date: true } }
        }
    })

    const yearMvpMap = new Map<number, Map<string, { name: string; count: number }>>()
    for (const award of allAwards) {
        const year = new Date(award.labMeeting.date).getFullYear()
        if (!yearMvpMap.has(year)) yearMvpMap.set(year, new Map())
        const userMap = yearMvpMap.get(year)!
        const existing = userMap.get(award.recipientId)
        if (existing) {
            existing.count++
        } else {
            userMap.set(award.recipientId, { name: award.recipient.name || '알 수 없음', count: 1 })
        }
    }

    const results = Array.from(yearMap.entries()).map(([year, stats]) => {
        const mvpMap = yearMvpMap.get(year)
        let mvp: { name: string; count: number } | null = null
        if (mvpMap && mvpMap.size > 0) {
            const topEntry = Array.from(mvpMap.values()).sort((a, b) => b.count - a.count)[0]
            mvp = topEntry
        }
        return {
            year,
            meetingCount: stats.meetingCount,
            materialsCount: stats.materialsCount,
            presenterCount: stats.presenterIds.size,
            monthsWithMeetings: Array.from(stats.monthsWithMeetings).sort((a, b) => a - b),
            mvp
        }
    })

    return results.sort((a, b) => b.year - a.year)
}

// Get meetings for a specific year/month
export async function getLabMeetingsByMonth(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 1)

    const meetings = await prisma.labMeeting.findMany({
        where: {
            date: { gte: startDate, lt: endDate }
        },
        include: {
            presenters: {
                include: {
                    user: { select: { id: true, name: true, image: true, medalPoints: true } }
                }
            },
            _count: { select: { materials: true } }
        },
        orderBy: { date: 'desc' }
    })

    return meetings.map(meeting => ({
        ...meeting,
        presenters: meeting.presenters.map(p => p.user),
        materialsCount: meeting._count.materials
    }))
}

// Get month stats for a specific year
export async function getLabMeetingMonthStats(year: number) {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year + 1, 0, 1)

    const meetings = await prisma.labMeeting.findMany({
        where: {
            date: { gte: startDate, lt: endDate }
        },
        include: {
            presenters: {
                include: {
                    user: { select: { id: true, name: true, image: true } }
                }
            },
            _count: { select: { materials: true } }
        },
        orderBy: { date: 'desc' }
    })

    // Group by month
    const monthStats = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        meetingCount: 0,
        materialsCount: 0,
        presenters: [] as { id: string; name: string | null; image: string | null }[]
    }))

    for (const m of meetings) {
        const month = new Date(m.date).getMonth()
        monthStats[month].meetingCount++
        monthStats[month].materialsCount += m._count.materials
        for (const p of m.presenters) {
            if (!monthStats[month].presenters.find(existing => existing.id === p.user.id)) {
                monthStats[month].presenters.push(p.user)
            }
        }
    }

    return monthStats
}

// Search lab meetings
export async function searchLabMeetings(query: string) {
    const meetings = await prisma.labMeeting.findMany({
        where: {
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { presenters: { some: { user: { name: { contains: query, mode: 'insensitive' } } } } }
            ]
        },
        include: {
            presenters: {
                include: {
                    user: { select: { id: true, name: true, image: true, medalPoints: true } }
                }
            },
            _count: { select: { materials: true } }
        },
        orderBy: { date: 'desc' }
    })

    return meetings.map(meeting => ({
        ...meeting,
        presenters: meeting.presenters.map(p => p.user),
        materialsCount: meeting._count.materials
    }))
}

// Get approved members for presenter selection
export async function getApprovedMembers() {
    const members = await prisma.user.findMany({
        where: { isApproved: true },
        select: {
            id: true,
            name: true,
            image: true,
            role: true
        },
        orderBy: { name: 'asc' }
    })

    return members
}
