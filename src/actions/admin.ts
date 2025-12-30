'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { STORAGE_BUCKET } from "@/lib/storage-constants"

// Get all pending counts for admin dashboard
export async function getAdminPendingCounts() {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { purchases: 0, tasks: 0, users: 0, inquiries: 0 }
    }

    const [purchases, tasks, users, inquiries] = await Promise.all([
        prisma.purchaseRequest.count({ where: { status: 'PENDING' } }),
        prisma.task.count({ where: { status: 'QUESTION' } }),
        prisma.user.count({ where: { isApproved: false } }),
        prisma.contactInquiry.count({ where: { isRead: false } })
    ])

    return { purchases, tasks, users, inquiries }
}

// ... existing imports ...

// Helper to extract path from URL
function getPathFromUrl(url: string | null) {
    if (!url) return null
    const parts = url.split(`/storage/v1/object/public/${STORAGE_BUCKET}/`)
    return parts.length > 1 ? parts[1] : null
}

// Clean up orphaned files in storage
export async function cleanupStorage() {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자 권한이 필요합니다." }
    }

    const report: string[] = []
    let totalDeleted = 0

    try {
        // defined folders to clean
        const folders = [
            'profiles',
            'materials',
            'professor',
            'inventory/msds',
            'inventory/quotations',
            'inventory/receipts',
            'task-attachments',
            'workspace'
        ]

        for (const folder of folders) {
            // 1. List files in folder
            const { data: files, error } = await supabaseAdmin.storage
                .from(STORAGE_BUCKET)
                .list(folder, { limit: 1000 })

            if (error || !files || files.length === 0) continue

            // 2. Get valid paths from DB based on folder
            let validPaths: Set<string> = new Set()

            if (folder === 'profiles') {
                const users = await prisma.user.findMany({ select: { image: true } })
                users.forEach(u => {
                    const path = getPathFromUrl(u.image)
                    if (path) validPaths.add(path)
                })
            } else if (folder === 'materials') {
                const materials = await prisma.material.findMany({ select: { url: true } })
                materials.forEach(m => {
                    const path = getPathFromUrl(m.url)
                    if (path) validPaths.add(path)
                })
            } else if (folder === 'professor') {
                const info = await prisma.professorInfo.findUnique({ where: { id: 'main' }, select: { profileImage: true } })
                if (info?.profileImage) {
                    const path = getPathFromUrl(info.profileImage)
                    if (path) validPaths.add(path)
                }
            } else if (folder === 'inventory/msds') {
                const items = await prisma.inventoryItem.findMany({ select: { msdsUrl: true } })
                items.forEach(i => {
                    const path = getPathFromUrl(i.msdsUrl)
                    if (path) validPaths.add(path)
                })
            } else if (folder === 'inventory/quotations') {
                const requests = await prisma.purchaseRequest.findMany({ select: { quotationUrl: true } })
                requests.forEach(r => {
                    const path = getPathFromUrl(r.quotationUrl)
                    if (path) validPaths.add(path)
                })
            } else if (folder === 'inventory/receipts') {
                const requests = await prisma.purchaseRequest.findMany({ select: { receiptUrl: true } })
                requests.forEach(r => {
                    const path = getPathFromUrl(r.receiptUrl)
                    if (path) validPaths.add(path)
                })
            } else if (folder === 'task-attachments') {
                const attachments = await prisma.taskAttachment.findMany({ select: { url: true } })
                attachments.forEach(a => {
                    const path = getPathFromUrl(a.url)
                    if (path) validPaths.add(path)
                })
            } else if (folder === 'workspace') {
                const resources = await prisma.workspaceResource.findMany({ where: { type: 'FILE' }, select: { url: true } })
                resources.forEach(r => {
                    const path = getPathFromUrl(r.url)
                    if (path) validPaths.add(path)
                })
            }

            // 3. Find orphans
            const orphans = files
                .filter(f => f.name !== '.emptyFolderPlaceholder' && !validPaths.has(`${folder}/${f.name}`))
                .map(f => `${folder}/${f.name}`)

            if (orphans.length > 0) {
                // 4. Delete orphans
                const { error: deleteError } = await supabaseAdmin.storage
                    .from(STORAGE_BUCKET)
                    .remove(orphans)

                if (deleteError) {
                    report.push(`[${folder}] 삭제 실패: ${deleteError.message}`)
                } else {
                    report.push(`[${folder}] ${orphans.length}개 파일 삭제됨`)
                    totalDeleted += orphans.length
                }
            } else {
                // report.push(`[${folder}] 정리할 파일 없음`)
            }
        }

        return {
            success: true,
            message: totalDeleted > 0 ? `총 ${totalDeleted}개의 사용되지 않는 파일을 정리했습니다.` : "정리할 파일이 없습니다.",
            details: report
        }

    } catch (error) {
        console.error('Storage cleanup error:', error)
        return { error: "저장소 정리 중 오류가 발생했습니다." }
    }
}
