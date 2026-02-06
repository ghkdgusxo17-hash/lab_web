'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { STORAGE_BUCKET } from '@/lib/storage-constants'

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
            const urlParts = material.url.split('/storage/v1/object/public/uploads/')
            if (urlParts.length > 1) {
                await supabaseAdmin.storage
                    .from(STORAGE_BUCKET)
                    .remove([urlParts[1]])
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

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath)

        // Create database record
        await prisma.material.create({
            data: {
                title,
                description: description || null,
                category,
                filename: file.name,
                url: urlData.publicUrl,
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
        const urlParts = material.url.split('/storage/v1/object/public/uploads/')
        if (urlParts.length > 1) {
            await supabaseAdmin.storage
                .from(STORAGE_BUCKET)
                .remove([urlParts[1]])
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
