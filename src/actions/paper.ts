'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { STORAGE_BUCKET, getProxyUrl, extractStoragePath } from '@/lib/storage-constants'

// ── 공통 헬퍼 ───────────────────────────────────────────────

async function requireApproved() {
    const session = await auth()
    if (!session?.user) return { error: '로그인이 필요합니다.', session: null }
    if (!session.user.isApproved && !session.user.isAdmin) return { error: '승인된 멤버만 이용할 수 있습니다.', session: null }
    return { error: null, session }
}

async function uploadFile(file: File, folder: string) {
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${folder}/${timestamp}_${safeName}`
    const bytes = await file.arrayBuffer()
    const { error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, Buffer.from(bytes), { contentType: file.type, upsert: true })
    if (error) return { error: '파일 업로드 중 오류가 발생했습니다.', url: null, filePath: null }
    return { error: null, url: getProxyUrl(filePath), filePath }
}

async function deleteFile(url: string) {
    const path = extractStoragePath(url)
    if (path) await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([path])
}

// ── 랩실 논문 (LabPaper) ──────────────────────────────────

export async function getLabPapers() {
    return prisma.labPaper.findMany({
        include: {
            uploader: { select: { id: true, name: true, image: true } },
            authors: { include: { user: { select: { id: true, name: true, image: true } } } },
            revisions: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
    })
}

export async function getLabPaper(id: string) {
    return prisma.labPaper.findUnique({
        where: { id },
        include: {
            uploader: { select: { id: true, name: true, image: true } },
            authors: { include: { user: { select: { id: true, name: true, image: true } } } },
            revisions: {
                include: { uploader: { select: { id: true, name: true, image: true } } },
                orderBy: { version: 'asc' },
            },
        },
    })
}

export async function createLabPaper(formData: FormData) {
    const { error, session } = await requireApproved()
    if (error) return { error }

    const title = formData.get('title') as string
    const abstract = formData.get('abstract') as string
    const journal = formData.get('journal') as string
    const status = formData.get('status') as string || 'WRITING'
    const year = formData.get('year') as string
    const doi = formData.get('doi') as string
    const authorIds = formData.getAll('authorIds') as string[]
    const file = formData.get('file') as File | null

    if (!title) return { error: '제목을 입력해주세요.' }

    let url: string | null = null
    let filename: string | null = null
    let size: number | null = null
    let mimeType: string | null = null

    if (file && file.size > 0) {
        const { error: uploadError, url: uploadedUrl } = await uploadFile(file, 'papers/lab')
        if (uploadError || !uploadedUrl) return { error: uploadError }
        url = uploadedUrl
        filename = file.name
        size = file.size
        mimeType = file.type || null
    }

    try {
        const paper = await prisma.labPaper.create({
            data: {
                title,
                abstract: abstract || null,
                journal: journal || null,
                status,
                year: year ? parseInt(year) : null,
                doi: doi || null,
                url,
                filename,
                size,
                mimeType,
                uploaderId: session!.user.id,
                authors: {
                    create: authorIds.map(userId => ({ userId })),
                },
            },
        })
        revalidatePath('/materials/paper/lab')
        return { success: true, id: paper.id }
    } catch (err: any) {
        console.error('createLabPaper error:', err)
        return { error: `논문 등록 중 오류: ${err?.message || '알 수 없는 오류'}` }
    }
}

export async function updateLabPaperStatus(id: string, status: string) {
    const { error, session } = await requireApproved()
    if (error) return { error }

    const paper = await prisma.labPaper.findUnique({ where: { id } })
    if (!paper) return { error: '논문을 찾을 수 없습니다.' }
    if (paper.uploaderId !== session!.user.id && !session!.user.isAdmin) {
        return { error: '수정 권한이 없습니다.' }
    }

    await prisma.labPaper.update({ where: { id }, data: { status } })
    revalidatePath(`/materials/paper/lab/${id}`)
    revalidatePath('/materials/paper/lab')
    return { success: true }
}

export async function deleteLabPaper(id: string) {
    const { error, session } = await requireApproved()
    if (error) return { error }

    const paper = await prisma.labPaper.findUnique({
        where: { id },
        include: { revisions: true },
    })
    if (!paper) return { error: '논문을 찾을 수 없습니다.' }
    if (paper.uploaderId !== session!.user.id && !session!.user.isAdmin) {
        return { error: '삭제 권한이 없습니다.' }
    }

    // 논문 파일 및 리비전 파일 삭제
    if (paper.url) await deleteFile(paper.url)
    for (const rev of paper.revisions) {
        await deleteFile(rev.url)
    }
    await prisma.labPaper.delete({ where: { id } })
    revalidatePath('/materials/paper/lab')
    return { success: true }
}

// ── 리비전 (PaperRevision) ────────────────────────────────

export async function addPaperRevision(formData: FormData) {
    const { error, session } = await requireApproved()
    if (error) return { error }

    const paperId = formData.get('paperId') as string
    const note = formData.get('note') as string
    const file = formData.get('file') as File

    if (!paperId || !file) return { error: '논문과 파일을 선택해주세요.' }

    const paper = await prisma.labPaper.findUnique({ where: { id: paperId } })
    if (!paper) return { error: '논문을 찾을 수 없습니다.' }

    // 다음 버전 번호
    const lastRevision = await prisma.paperRevision.findFirst({
        where: { paperId },
        orderBy: { version: 'desc' },
    })
    const nextVersion = (lastRevision?.version ?? 0) + 1

    const { error: uploadError, url } = await uploadFile(file, 'papers/revisions')
    if (uploadError || !url) return { error: uploadError }

    try {
        await prisma.paperRevision.create({
            data: {
                paperId,
                version: nextVersion,
                note: note || null,
                url,
                filename: file.name,
                size: file.size,
                mimeType: file.type || null,
                uploaderId: session!.user.id,
            },
        })
        revalidatePath(`/materials/paper/lab/${paperId}`)
        return { success: true }
    } catch {
        return { error: '리비전 업로드 중 오류가 발생했습니다.' }
    }
}

export async function deletePaperRevision(id: string) {
    const { error, session } = await requireApproved()
    if (error) return { error }

    const revision = await prisma.paperRevision.findUnique({ where: { id } })
    if (!revision) return { error: '리비전을 찾을 수 없습니다.' }
    if (revision.uploaderId !== session!.user.id && !session!.user.isAdmin) {
        return { error: '삭제 권한이 없습니다.' }
    }

    await deleteFile(revision.url)
    await prisma.paperRevision.delete({ where: { id } })
    revalidatePath(`/materials/paper/lab/${revision.paperId}`)
    return { success: true }
}

// ── 읽은 논문 (ReadingPaper) ──────────────────────────────

export async function getReadingPapers(readerId?: string) {
    return prisma.readingPaper.findMany({
        where: readerId ? { readerId } : undefined,
        include: {
            reader: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
    })
}

export async function createReadingPaper(formData: FormData) {
    const { error, session } = await requireApproved()
    if (error) return { error }

    const title = formData.get('title') as string
    const authors = formData.get('authors') as string
    const year = formData.get('year') as string
    const abstract = formData.get('abstract') as string
    const externalUrl = formData.get('externalUrl') as string
    const pptFile = formData.get('pptFile') as File | null

    if (!title) return { error: '제목을 입력해주세요.' }

    let pptUrl: string | null = null
    let pptFilename: string | null = null
    let pptSize: number | null = null
    let pptMimeType: string | null = null

    if (pptFile && pptFile.size > 0) {
        const { error: uploadError, url } = await uploadFile(pptFile, 'papers/reading')
        if (uploadError || !url) return { error: uploadError }
        pptUrl = url
        pptFilename = pptFile.name
        pptSize = pptFile.size
        pptMimeType = pptFile.type || null
    }

    try {
        await prisma.readingPaper.create({
            data: {
                title,
                authors: authors || null,
                year: year ? parseInt(year) : null,
                abstract: abstract || null,
                externalUrl: externalUrl || null,
                pptUrl,
                pptFilename,
                pptSize,
                pptMimeType,
                readerId: session!.user.id,
            },
        })
        revalidatePath('/materials/paper/reading')
        return { success: true }
    } catch {
        return { error: '논문 등록 중 오류가 발생했습니다.' }
    }
}

export async function deleteReadingPaper(id: string) {
    const { error, session } = await requireApproved()
    if (error) return { error }

    const paper = await prisma.readingPaper.findUnique({ where: { id } })
    if (!paper) return { error: '논문을 찾을 수 없습니다.' }
    if (paper.readerId !== session!.user.id && !session!.user.isAdmin) {
        return { error: '삭제 권한이 없습니다.' }
    }

    if (paper.pptUrl) await deleteFile(paper.pptUrl)
    await prisma.readingPaper.delete({ where: { id } })
    revalidatePath('/materials/paper/reading')
    return { success: true }
}

// ── 공통 헬퍼 ─────────────────────────────────────────────

export async function getLabMembers() {
    return prisma.user.findMany({
        where: { isApproved: true },
        select: { id: true, name: true, image: true, role: true },
        orderBy: { name: 'asc' },
    })
}
