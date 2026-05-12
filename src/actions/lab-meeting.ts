'use server'

import { revalidatePath } from 'next/cache'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import {
    LAB_MEETING_PRIVATE_BUCKET,
    buildSecureStorageUrl,
    ensureLabMeetingPrivateBucket,
    parseStoredMaterialLocation,
} from '@/lib/lab-meeting-material-security'

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
                    },
                    feedbacks: {
                        include: {
                            author: {
                                select: { id: true, name: true, image: true }
                            }
                        },
                        orderBy: { createdAt: 'asc' }
                    },
                    referenceMaterials: {
                        include: {
                            uploader: {
                                select: { id: true, name: true, image: true, medalPoints: true }
                            },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                } as any,
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
        return { error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "?뱀씤??硫ㅻ쾭留??⑸??낆쓣 ?앹꽦?????덉뒿?덈떎." }
    }

    const date = formData.get('date') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const presenterIds = formData.getAll('presenterIds') as string[]

    if (!date || !title) {
        return { error: "?좎쭨? ?쒕ぉ???낅젰?댁＜?몄슂." }
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
        return { error: "?⑸????앹꽦 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." }
    }
}

// Update lab meeting (Admin or Approved members)
export async function updateLabMeeting(id: string, formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "?섏젙 沅뚰븳???놁뒿?덈떎." }
    }

    const date = formData.get('date') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const presenterIds = formData.getAll('presenterIds') as string[]

    if (!date || !title) {
        return { error: "?좎쭨? ?쒕ぉ???낅젰?댁＜?몄슂." }
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.labMeetingPresenter.deleteMany({
                where: { labMeetingId: id }
            })

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
        return { error: "?⑸????섏젙 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." }
    }
}

// Delete lab meeting (Admin only)
export async function deleteLabMeeting(id: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" }
    }

    if (!session.user.isAdmin) {
        return { error: "愿由ъ옄留???젣?????덉뒿?덈떎." }
    }

    try {
        const materials = await prisma.material.findMany({
            where: { labMeetingId: id }
        })

        for (const material of materials) {
            const location = parseStoredMaterialLocation(material.url)
            if (location) {
                await supabaseAdmin.storage
                    .from(location.bucket)
                    .remove([location.path])
            }
        }

        await prisma.labMeeting.delete({
            where: { id }
        })

        revalidatePath('/materials/lab-meeting')
        revalidatePath('/materials/lab-meeting/presenters')
        return { success: true }
    } catch (error) {
        console.error('Delete lab meeting error:', error)
        return { error: "?⑸?????젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." }
    }
}

async function uploadLabMeetingFileToStorage(file: File) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${crypto.randomUUID()}_${safeName}`
    const filePath = `lab-meeting/${filename}`
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await supabaseAdmin.storage
        .from(LAB_MEETING_PRIVATE_BUCKET)
        .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
        })

    if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        throw new Error('파일 업로드 중 오류가 발생했습니다.')
    }

    return {
        title: file.name.replace(/\.[^/.]+$/, ''),
        filename: file.name,
        url: buildSecureStorageUrl(LAB_MEETING_PRIVATE_BUCKET, filePath),
        size: file.size,
        mimeType: file.type,
    }
}

export async function uploadLabMeetingMaterial(labMeetingId: string, formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: '로그인이 필요합니다.' }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: '승인된 멤버만 자료를 업로드할 수 있습니다.' }
    }

    const title = String(formData.get('title') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const category = String(formData.get('category') ?? 'PPT').trim() || 'PPT'
    const presenterId = String(formData.get('presenterId') ?? '').trim()
    const file = formData.get('file') as File
    const referenceFiles = formData
        .getAll('referenceFiles')
        .filter((value): value is File => value instanceof File && value.size > 0)

    if (!title || !file) {
        return { error: '제목과 발표자료 파일을 입력해주세요.' }
    }

    try {
        let validPresenterId: string | null = null
        if (presenterId) {
            const presenter = await prisma.user.findFirst({
                where: { id: presenterId, isApproved: true },
                select: { id: true },
            })

            if (!presenter) {
                return { error: '발표자를 찾을 수 없습니다.' }
            }

            validPresenterId = presenter.id
        }

        await ensureLabMeetingPrivateBucket()

        const uploadedMainFile = await uploadLabMeetingFileToStorage(file)
        const uploadedReferenceFiles: Awaited<ReturnType<typeof uploadLabMeetingFileToStorage>>[] = []

        for (const referenceFile of referenceFiles) {
            uploadedReferenceFiles.push(await uploadLabMeetingFileToStorage(referenceFile))
        }

        await prisma.$transaction(async (tx) => {
            const mainMaterial = await tx.material.create({
                data: {
                    title,
                    description: description || null,
                    category,
                    filename: uploadedMainFile.filename,
                    url: uploadedMainFile.url,
                    size: uploadedMainFile.size,
                    mimeType: uploadedMainFile.mimeType,
                    uploaderId: session.user.id,
                    presenterId: validPresenterId,
                    labMeetingId,
                },
            })

            if (uploadedReferenceFiles.length > 0) {
                await tx.material.createMany({
                    data: uploadedReferenceFiles.map((referenceFile) => ({
                        title: referenceFile.title,
                        description: null,
                        category: 'REFERENCE',
                        filename: referenceFile.filename,
                        url: referenceFile.url,
                        size: referenceFile.size,
                        mimeType: referenceFile.mimeType,
                        uploaderId: session.user.id,
                        presenterId: null,
                        labMeetingId,
                        parentMaterialId: mainMaterial.id,
                    })) as any,
                })
            }
        })

        revalidatePath(`/materials/lab-meeting/${labMeetingId}`)
        revalidatePath('/materials/lab-meeting/presenters')
        return { success: true }
    } catch (error) {
        console.error('Upload error:', error)
        return { error: '파일 업로드 중 오류가 발생했습니다.' }
    }
}

// Upload material to lab meeting
async function uploadLabMeetingMaterialLegacy(labMeetingId: string, formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "?뱀씤??硫ㅻ쾭留??먮즺瑜??낅줈?쒗븷 ???덉뒿?덈떎." }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string || 'PPT'
    const presenterId = ((formData.get('presenterId') as string | null) || '').trim()
    const file = formData.get('file') as File
    const referenceFiles = formData
        .getAll('referenceFiles')
        .filter((value): value is File => value instanceof File && value.size > 0)

    if (!title || !file) {
        return { error: "?쒕ぉ怨??뚯씪???낅젰?댁＜?몄슂." }
    }

    try {
        let validPresenterId: string | null = null
        if (presenterId) {
            const presenter = await prisma.user.findFirst({
                where: { id: presenterId, isApproved: true },
                select: { id: true },
            })

            if (!presenter) {
                return { error: "발표자를 찾을 수 없습니다." }
            }

            validPresenterId = presenter.id
        }

        await ensureLabMeetingPrivateBucket()

        const uploadedMainFile = await uploadLabMeetingFileToStorage(file)
        const uploadedReferenceFiles: Awaited<ReturnType<typeof uploadLabMeetingFileToStorage>>[] = []

        for (const referenceFile of referenceFiles) {
            uploadedReferenceFiles.push(await uploadLabMeetingFileToStorage(referenceFile))
        }
        const uploadError = null
        const filePath = uploadedMainFile.url

        if (uploadError) {
            console.error('Supabase upload error:', uploadError)
            return { error: "?뚯씪 ?낅줈??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." }
        }

        await prisma.material.create({
            data: {
                title,
                description: description || null,
                category,
                filename: file.name,
                url: buildSecureStorageUrl(LAB_MEETING_PRIVATE_BUCKET, filePath),
                size: file.size,
                mimeType: file.type,
                uploaderId: session.user.id,
                presenterId: validPresenterId,
                labMeetingId
            }
        })

        revalidatePath(`/materials/lab-meeting/${labMeetingId}`)
        revalidatePath('/materials/lab-meeting/presenters')
        return { success: true }
    } catch (error) {
        console.error('Upload error:', error)
        return { error: "?뚯씪 ?낅줈??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." }
    }
}

// Delete material from lab meeting
export async function deleteLabMeetingMaterial(materialId: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" }
    }

    const material = await prisma.material.findUnique({
        where: { id: materialId },
        include: { referenceMaterials: true } as any,
    })

    if (!material) {
        return { error: "?먮즺瑜?李얠쓣 ???놁뒿?덈떎." }
    }

    if (material.uploaderId !== session.user.id && !session.user.isAdmin) {
        return { error: "??젣 沅뚰븳???놁뒿?덈떎." }
    }

    try {
        const materialsToRemove = [material, ...((material as any).referenceMaterials ?? [])]
        for (const item of materialsToRemove) {
            const location = parseStoredMaterialLocation(item.url)
            if (location) {
                await supabaseAdmin.storage
                    .from(location.bucket)
                    .remove([location.path])
            }
        }

        await prisma.material.delete({
            where: { id: materialId }
        })

        if (material.labMeetingId) {
            revalidatePath(`/materials/lab-meeting/${material.labMeetingId}`)
        }
        revalidatePath('/materials/lab-meeting/presenters')
        return { success: true }
    } catch (error) {
        console.error('Delete error:', error)
        return { error: "??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." }
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
            userMap.set(award.recipientId, { name: award.recipient.name || '?????놁쓬', count: 1 })
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

export async function getLabMeetingPresenterArchive(filters?: { search?: string; presenterId?: string }) {
    const session = await auth()

    if (!session?.user || (!session.user.isApproved && !session.user.isAdmin)) {
        return {
            groups: [],
            presenterOptions: [],
            totalMaterials: 0,
            totalPresenters: 0,
        }
    }

    const search = filters?.search?.trim()
    const presenterId = filters?.presenterId?.trim()
    const where: Prisma.MaterialWhereInput = {
        labMeetingId: { not: null },
        presenterId: { not: null },
    }

    if (presenterId) {
        where.presenterId = presenterId
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { filename: { contains: search, mode: 'insensitive' } },
            { presenter: { is: { name: { contains: search, mode: 'insensitive' } } } },
            { labMeeting: { is: { title: { contains: search, mode: 'insensitive' } } } },
        ]
    }

    const [materials, presenterOptions] = await Promise.all([
        prisma.material.findMany({
            where,
            include: {
                presenter: {
                    select: { id: true, name: true, image: true, role: true, medalPoints: true },
                },
                uploader: {
                    select: { id: true, name: true, image: true },
                },
                labMeeting: {
                    select: { id: true, title: true, date: true },
                },
                transcription: {
                    select: { id: true, status: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.user.findMany({
            where: {
                materialsPresented: {
                    some: {
                        labMeetingId: { not: null },
                    },
                },
            },
            select: { id: true, name: true, image: true, role: true, medalPoints: true },
            orderBy: { name: 'asc' },
        }),
    ])

    const sortedMaterials = materials
        .filter((material) => material.presenter && material.labMeeting)
        .sort((a, b) => {
            const bDate = b.labMeeting?.date ?? b.createdAt
            const aDate = a.labMeeting?.date ?? a.createdAt
            return bDate.getTime() - aDate.getTime()
        })

    const groupMap = new Map<string, {
        presenter: NonNullable<(typeof sortedMaterials)[number]['presenter']>
        materials: typeof sortedMaterials
    }>()

    for (const material of sortedMaterials) {
        if (!material.presenter) continue
        const existing = groupMap.get(material.presenter.id)
        if (existing) {
            existing.materials.push(material)
        } else {
            groupMap.set(material.presenter.id, {
                presenter: material.presenter,
                materials: [material],
            })
        }
    }

    const groups = Array.from(groupMap.values())
        .map((group) => ({
            ...group,
            materialCount: group.materials.length,
            latestDate: group.materials[0]?.labMeeting?.date ?? group.materials[0]?.createdAt ?? null,
        }))
        .sort((a, b) => (b.latestDate?.getTime() ?? 0) - (a.latestDate?.getTime() ?? 0))

    return {
        groups,
        presenterOptions,
        totalMaterials: sortedMaterials.length,
        totalPresenters: groups.length,
    }
}

// ============ Material Feedback ============

export async function addMaterialFeedback(materialId: string, content: string) {
    const session = await auth()
    if (!session?.user) return { error: '濡쒓렇?몄씠 ?꾩슂?⑸땲??' }
    if (!session.user.isApproved && !session.user.isAdmin) return { error: '沅뚰븳???놁뒿?덈떎.' }
    if (!content.trim()) return { error: '?댁슜???낅젰?댁＜?몄슂.' }

    const material = await prisma.material.findUnique({
        where: { id: materialId },
        select: { labMeetingId: true },
    })
    if (!material) return { error: '?먮즺瑜?李얠쓣 ???놁뒿?덈떎.' }

    await prisma.materialFeedback.create({
        data: { materialId, authorId: session.user.id, content: content.trim() },
    })

    if (material.labMeetingId) {
        revalidatePath(`/materials/lab-meeting/${material.labMeetingId}`)
    }
    return { success: true }
}

export async function updateMaterialFeedback(feedbackId: string, content: string) {
    const session = await auth()
    if (!session?.user) return { error: '濡쒓렇?몄씠 ?꾩슂?⑸땲??' }
    if (!content.trim()) return { error: '?댁슜???낅젰?댁＜?몄슂.' }

    const feedback = await prisma.materialFeedback.findUnique({
        where: { id: feedbackId },
        include: { material: { select: { labMeetingId: true } } },
    })
    if (!feedback) return { error: '?쇰뱶諛깆쓣 李얠쓣 ???놁뒿?덈떎.' }
    if (feedback.authorId !== session.user.id && !session.user.isAdmin) {
        return { error: '?섏젙 沅뚰븳???놁뒿?덈떎.' }
    }

    await prisma.materialFeedback.update({
        where: { id: feedbackId },
        data: { content: content.trim() },
    })

    if (feedback.material.labMeetingId) {
        revalidatePath(`/materials/lab-meeting/${feedback.material.labMeetingId}`)
    }
    return { success: true }
}

export async function deleteMaterialFeedback(feedbackId: string) {
    const session = await auth()
    if (!session?.user) return { error: '濡쒓렇?몄씠 ?꾩슂?⑸땲??' }

    const feedback = await prisma.materialFeedback.findUnique({
        where: { id: feedbackId },
        include: { material: { select: { labMeetingId: true } } },
    })
    if (!feedback) return { error: '?쇰뱶諛깆쓣 李얠쓣 ???놁뒿?덈떎.' }
    if (feedback.authorId !== session.user.id && !session.user.isAdmin) {
        return { error: '??젣 沅뚰븳???놁뒿?덈떎.' }
    }

    await prisma.materialFeedback.delete({ where: { id: feedbackId } })

    if (feedback.material.labMeetingId) {
        revalidatePath(`/materials/lab-meeting/${feedback.material.labMeetingId}`)
    }
    return { success: true }
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
