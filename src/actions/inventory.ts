'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { STORAGE_BUCKET } from '@/lib/storage-constants'

// ============ Inventory Items ============

// Get all inventory items
export async function getInventoryItems(category?: string, search?: string) {
    const where: any = {}

    if (category && category !== 'ALL') {
        where.category = category
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { manufacturer: { contains: search, mode: 'insensitive' } },
            { catalogNo: { contains: search, mode: 'insensitive' } },
            { location: { contains: search, mode: 'insensitive' } }
        ]
    }

    const items = await prisma.inventoryItem.findMany({
        where,
        orderBy: { name: 'asc' }
    })

    return items
}

// Get single inventory item with transactions
export async function getInventoryItem(id: string) {
    const item = await prisma.inventoryItem.findUnique({
        where: { id },
        include: {
            transactions: {
                include: {
                    performedBy: {
                        select: { id: true, name: true, image: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 20
            }
        }
    })

    return item
}

// Create inventory item (Admin only)
export async function createInventoryItem(formData: FormData) {
    const session = await auth()

    if (!session?.user?.isAdmin && !session?.user?.isApproved) {
        return { error: "승인된 멤버만 품목을 등록할 수 있습니다." }
    }

    const name = formData.get('name') as string
    const category = formData.get('category') as string || 'OTHER'
    const quantity = parseInt(formData.get('quantity') as string) || 0
    const unit = formData.get('unit') as string || '개'
    const minQuantity = parseInt(formData.get('minQuantity') as string) || 0
    const location = formData.get('location') as string || null
    const expiryDateStr = formData.get('expiryDate') as string
    const manufacturer = formData.get('manufacturer') as string || null
    const catalogNo = formData.get('catalogNo') as string || null
    const purchaseUrl = formData.get('purchaseUrl') as string || null
    const notes = formData.get('notes') as string || null

    if (!name) {
        return { error: "품명을 입력해주세요." }
    }

    // Handle MSDS file upload
    let msdsUrl = null
    const msdsFile = formData.get('msdsFile') as File
    if (msdsFile && msdsFile.size > 0) {
        try {
            const bytes = await msdsFile.arrayBuffer()
            const buffer = Buffer.from(bytes)
            const timestamp = Date.now()
            const safeName = msdsFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
            const filePath = `inventory/msds/${timestamp}_${safeName}`

            const { error: uploadError } = await supabaseAdmin.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, buffer, {
                    contentType: msdsFile.type,
                    upsert: true,
                })

            if (!uploadError) {
                const { data: urlData } = supabaseAdmin.storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(filePath)
                msdsUrl = urlData.publicUrl
            }
        } catch (e) {
            console.error('MSDS upload error:', e)
        }
    }

    const item = await prisma.inventoryItem.create({
        data: {
            name,
            category,
            quantity,
            unit,
            minQuantity,
            location,
            expiryDate: expiryDateStr ? new Date(expiryDateStr) : null,
            manufacturer,
            catalogNo,
            purchaseUrl,
            msdsUrl,
            notes
        }
    })

    revalidatePath('/inventory')
    return { success: true, id: item.id }
}

// Update inventory item (Admin only)
export async function updateInventoryItem(id: string, formData: FormData) {
    const session = await auth()

    if (!session?.user?.isAdmin && !session?.user?.isApproved) {
        return { error: "승인된 멤버만 품목을 수정할 수 있습니다." }
    }

    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const unit = formData.get('unit') as string
    const minQuantity = parseInt(formData.get('minQuantity') as string) || 0
    const location = formData.get('location') as string || null
    const expiryDateStr = formData.get('expiryDate') as string
    const manufacturer = formData.get('manufacturer') as string || null
    const catalogNo = formData.get('catalogNo') as string || null
    const purchaseUrl = formData.get('purchaseUrl') as string || null
    const notes = formData.get('notes') as string || null

    if (!name) {
        return { error: "품명을 입력해주세요." }
    }

    await prisma.inventoryItem.update({
        where: { id },
        data: {
            name,
            category,
            unit,
            minQuantity,
            location,
            expiryDate: expiryDateStr ? new Date(expiryDateStr) : null,
            manufacturer,
            catalogNo,
            purchaseUrl,
            notes
        }
    })

    revalidatePath('/inventory')
    revalidatePath(`/inventory/items/${id}`)
    return { success: true }
}

// Delete inventory item (Admin only)
export async function deleteInventoryItem(id: string) {
    const session = await auth()

    if (!session?.user?.isAdmin && !session?.user?.isApproved) {
        return { error: "승인된 멤버만 품목을 삭제할 수 있습니다." }
    }

    const item = await prisma.inventoryItem.findUnique({
        where: { id },
        select: { msdsUrl: true }
    })

    if (item?.msdsUrl) {
        const parts = item.msdsUrl.split(`/storage/v1/object/public/${STORAGE_BUCKET}/`)
        if (parts.length > 1) {
            const filePath = parts[1]
            await supabaseAdmin.storage
                .from(STORAGE_BUCKET)
                .remove([filePath])
        }
    }

    await prisma.inventoryItem.delete({
        where: { id }
    })

    revalidatePath('/inventory')
    return { success: true }
}

// Record inventory transaction (입출고)
export async function recordInventoryTransaction(
    itemId: string,
    type: 'IN' | 'OUT',
    quantity: number,
    reason?: string
) {
    const session = await auth()

    if (!session?.user?.id) {
        return { error: "로그인이 필요합니다." }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "승인된 멤버만 입출고 기록이 가능합니다." }
    }

    if (quantity <= 0) {
        return { error: "수량은 1 이상이어야 합니다." }
    }

    const item = await prisma.inventoryItem.findUnique({
        where: { id: itemId }
    })

    if (!item) {
        return { error: "품목을 찾을 수 없습니다." }
    }

    // Check if enough stock for OUT
    if (type === 'OUT' && item.quantity < quantity) {
        return { error: "재고가 부족합니다." }
    }

    // Calculate new quantity
    const newQuantity = type === 'IN'
        ? item.quantity + quantity
        : item.quantity - quantity

    // Create transaction and update item quantity
    await prisma.$transaction([
        prisma.inventoryTransaction.create({
            data: {
                itemId,
                type,
                quantity,
                reason,
                performedById: session.user.id
            }
        }),
        prisma.inventoryItem.update({
            where: { id: itemId },
            data: { quantity: newQuantity }
        })
    ])

    revalidatePath('/inventory')
    revalidatePath(`/inventory/items/${itemId}`)
    return { success: true }
}

// Get low stock items
export async function getLowStockItems() {
    const items = await prisma.inventoryItem.findMany({
        where: {
            quantity: {
                lte: prisma.inventoryItem.fields.minQuantity
            }
        }
    })

    // Since Prisma doesn't support comparing two fields directly,
    // we filter in application
    const allItems = await prisma.inventoryItem.findMany()
    return allItems.filter(item => item.quantity <= item.minQuantity && item.minQuantity > 0)
}

// ============ Purchase Requests ============

// Get all purchase requests
export async function getPurchaseRequests(status?: string, category?: string) {
    const session = await auth()

    if (!session?.user?.id) {
        return []
    }

    const where: any = {}

    if (status && status !== 'ALL') {
        where.status = status
    }

    if (category && category !== 'ALL') {
        where.category = category
    }

    // Non-admin users can only see their own requests
    if (!session.user.isAdmin) {
        where.requesterId = session.user.id
    }

    const requests = await prisma.purchaseRequest.findMany({
        where,
        include: {
            requester: {
                select: { id: true, name: true, image: true }
            },
            approver: {
                select: { id: true, name: true }
            },
            items: true
        },
        orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
        ]
    })

    return requests
}

// Get single purchase request
export async function getPurchaseRequest(id: string) {
    const request = await prisma.purchaseRequest.findUnique({
        where: { id },
        include: {
            requester: {
                select: { id: true, name: true, image: true }
            },
            approver: {
                select: { id: true, name: true }
            },
            items: true
        }
    })

    return request
}

// Create purchase request
export async function createPurchaseRequest(formData: FormData) {
    const session = await auth()

    if (!session?.user?.id) {
        return { error: "로그인이 필요합니다." }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "승인된 멤버만 구매 요청이 가능합니다." }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string || null
    const category = formData.get('category') as string || 'OTHER'
    const priority = formData.get('priority') as string || 'NORMAL'
    const estimatedCost = parseInt(formData.get('estimatedCost') as string) || 0
    const itemsJson = formData.get('items') as string

    if (!title) {
        return { error: "제목을 입력해주세요." }
    }

    if (estimatedCost <= 0) {
        return { error: "예상 금액을 입력해주세요." }
    }

    // Parse items
    let items: { name: string; quantity: number; unitPrice?: number; url?: string }[] = []
    try {
        if (itemsJson) {
            items = JSON.parse(itemsJson)
        }
    } catch {
        // Ignore parse errors
    }

    // Handle quotation file upload
    let quotationUrl = null
    const quotationFile = formData.get('quotationFile') as File
    if (quotationFile && quotationFile.size > 0) {
        try {
            const bytes = await quotationFile.arrayBuffer()
            const buffer = Buffer.from(bytes)
            const timestamp = Date.now()
            const safeName = quotationFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
            const filePath = `inventory/quotations/${timestamp}_${safeName}`

            const { error: uploadError } = await supabaseAdmin.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, buffer, {
                    contentType: quotationFile.type,
                    upsert: true,
                })

            if (!uploadError) {
                const { data: urlData } = supabaseAdmin.storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(filePath)
                quotationUrl = urlData.publicUrl
            }
        } catch (e) {
            console.error('Quotation upload error:', e)
        }
    }

    const request = await prisma.purchaseRequest.create({
        data: {
            title,
            description,
            category,
            priority,
            estimatedCost,
            quotationUrl,
            requesterId: session.user.id,
            items: items.length > 0 ? {
                create: items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice || null,
                    url: item.url || null
                }))
            } : undefined
        }
    })

    revalidatePath('/inventory/purchase')
    return { success: true, id: request.id }
}

// Approve purchase request (Admin only)
export async function approvePurchaseRequest(id: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 승인할 수 있습니다." }
    }

    await prisma.purchaseRequest.update({
        where: { id },
        data: {
            status: 'APPROVED',
            approverId: session.user.id,
            approvedAt: new Date()
        }
    })

    revalidatePath('/inventory/purchase')
    revalidatePath(`/inventory/purchase/${id}`)
    return { success: true }
}

// Start purchase (Admin only) - APPROVED -> IN_PROGRESS
export async function startPurchase(id: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 구매진행 처리할 수 있습니다." }
    }

    await prisma.purchaseRequest.update({
        where: { id },
        data: {
            status: 'IN_PROGRESS'
        }
    })

    revalidatePath('/inventory/purchase')
    revalidatePath(`/inventory/purchase/${id}`)
    return { success: true }
}

// Reject purchase request (Admin only)
export async function rejectPurchaseRequest(id: string, reason: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 반려할 수 있습니다." }
    }

    await prisma.purchaseRequest.update({
        where: { id },
        data: {
            status: 'REJECTED',
            approverId: session.user.id,
            approvedAt: new Date(),
            rejectReason: reason
        }
    })

    revalidatePath('/inventory/purchase')
    revalidatePath(`/inventory/purchase/${id}`)
    return { success: true }
}

// Mark as purchased (Admin only)
export async function markAsPurchased(id: string, actualCost: number, receiptFile?: File) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 구매 완료 처리할 수 있습니다." }
    }

    let receiptUrl = null
    if (receiptFile && receiptFile.size > 0) {
        try {
            const bytes = await receiptFile.arrayBuffer()
            const buffer = Buffer.from(bytes)
            const timestamp = Date.now()
            const safeName = receiptFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
            const filePath = `inventory/receipts/${timestamp}_${safeName}`

            const { error: uploadError } = await supabaseAdmin.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, buffer, {
                    contentType: receiptFile.type,
                    upsert: true,
                })

            if (!uploadError) {
                const { data: urlData } = supabaseAdmin.storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(filePath)
                receiptUrl = urlData.publicUrl
            }
        } catch (e) {
            console.error('Receipt upload error:', e)
        }
    }

    await prisma.purchaseRequest.update({
        where: { id },
        data: {
            status: 'PURCHASED',
            actualCost,
            receiptUrl,
            purchasedAt: new Date()
        }
    })

    revalidatePath('/inventory/purchase')
    revalidatePath(`/inventory/purchase/${id}`)
    return { success: true }
}

// Delete purchase request (Admin or requester)
export async function deletePurchaseRequest(id: string) {
    const session = await auth()

    if (!session?.user?.id) {
        return { error: "로그인이 필요합니다." }
    }

    const request = await prisma.purchaseRequest.findUnique({
        where: { id },
        select: { requesterId: true, status: true }
    })

    if (!request) {
        return { error: "요청을 찾을 수 없습니다." }
    }

    // Only admin or requester can delete
    // Requester can only delete if not purchased, admin can delete everything
    const canDelete = session.user.isAdmin || request.requesterId === session.user.id
    if (!canDelete) {
        return { error: "삭제 권한이 없습니다." }
    }

    // Non-admin can't delete purchased requests
    if (!session.user.isAdmin && request.status === 'PURCHASED') {
        return { error: "완료된 요청은 삭제할 수 없습니다." }
    }


    // Delete related files from Supabase Storage
    const requestWithFiles = await prisma.purchaseRequest.findUnique({
        where: { id },
        select: { quotationUrl: true, receiptUrl: true }
    })

    const filesToDelete: string[] = []

    if (requestWithFiles?.quotationUrl) {
        const parts = requestWithFiles.quotationUrl.split(`/storage/v1/object/public/${STORAGE_BUCKET}/`)
        if (parts.length > 1) filesToDelete.push(parts[1])
    }

    if (requestWithFiles?.receiptUrl) {
        const parts = requestWithFiles.receiptUrl.split(`/storage/v1/object/public/${STORAGE_BUCKET}/`)
        if (parts.length > 1) filesToDelete.push(parts[1])
    }

    if (filesToDelete.length > 0) {
        await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .remove(filesToDelete)
    }

    // Delete related items first
    await prisma.purchaseItem.deleteMany({
        where: { requestId: id }
    })

    await prisma.purchaseRequest.delete({
        where: { id }
    })

    revalidatePath('/inventory/purchase')
    return { success: true }
}

// ============ Ledger Accounts (간단한 계좌/잔액 관리) ============

// Get all ledger accounts
export async function getLedgerAccounts() {
    const accounts = await prisma.ledgerAccount.findMany({
        include: {
            recordedBy: {
                select: { id: true, name: true }
            }
        },
        orderBy: [{ section: 'asc' }, { name: 'asc' }]
    })

    return accounts
}

// Get total balance
export async function getLedgerSummary() {
    const accounts = await prisma.ledgerAccount.findMany()
    const totalBalance = accounts.reduce((sum: number, acc: { balance: number }) => sum + acc.balance, 0)
    return { totalBalance, accountCount: accounts.length }
}

// Get unique ledger sections
export async function getLedgerSections() {
    const sections = await prisma.ledgerAccount.groupBy({
        by: ['section'],
        orderBy: { section: 'asc' }
    })

    return sections.map(s => s.section)
}

// Create ledger account (Admin only)
export async function createLedgerAccount(formData: FormData) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 계좌를 추가할 수 있습니다." }
    }

    const section = formData.get('section') as string || '기본'
    const name = formData.get('name') as string
    const balance = parseInt(formData.get('balance') as string) || 0
    const description = formData.get('description') as string || null

    if (!name) {
        return { error: "항목명을 입력해주세요." }
    }

    await prisma.ledgerAccount.create({
        data: {
            section,
            name,
            balance,
            description,
            recordedById: session.user.id
        }
    })

    revalidatePath('/inventory/ledger')
    return { success: true }
}

// Update ledger account balance (Admin only)
export async function updateLedgerAccount(id: string, formData: FormData) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 수정할 수 있습니다." }
    }

    const section = formData.get('section') as string || '기본'
    const name = formData.get('name') as string
    const balance = parseInt(formData.get('balance') as string) || 0
    const description = formData.get('description') as string || null

    if (!name) {
        return { error: "항목명을 입력해주세요." }
    }

    await prisma.ledgerAccount.update({
        where: { id },
        data: {
            section,
            name,
            balance,
            description
        }
    })

    revalidatePath('/inventory/ledger')
    return { success: true }
}

// Delete ledger account (Admin only)
export async function deleteLedgerAccount(id: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 삭제할 수 있습니다." }
    }

    await prisma.ledgerAccount.delete({
        where: { id }
    })

    revalidatePath('/inventory/ledger')
    return { success: true }
}

// Get ledger account with transactions
export async function getLedgerAccountWithTransactions(id: string) {
    const account = await prisma.ledgerAccount.findUnique({
        where: { id },
        include: {
            recordedBy: {
                select: { id: true, name: true }
            },
            transactions: {
                orderBy: { date: 'asc' }
            }
        }
    })

    return account
}

// Add ledger transaction
export async function addLedgerTransaction(accountId: string, formData: FormData) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 거래를 추가할 수 있습니다." }
    }

    const dateStr = formData.get('date') as string
    const description = formData.get('description') as string
    const expense = parseInt(formData.get('expense') as string) || 0
    const income = parseInt(formData.get('income') as string) || 0
    const note = formData.get('note') as string || null

    if (!dateStr || !description) {
        return { error: "날짜와 내역을 입력해주세요." }
    }

    if (expense === 0 && income === 0) {
        return { error: "지출 또는 입금 금액을 입력해주세요." }
    }

    // Get previous balance
    const lastTransaction = await prisma.ledgerTransaction.findFirst({
        where: { accountId },
        orderBy: { date: 'desc' }
    })

    const previousBalance = lastTransaction?.balance || 0
    const newBalance = previousBalance + income - expense

    // Create transaction
    await prisma.ledgerTransaction.create({
        data: {
            accountId,
            date: new Date(dateStr),
            description,
            expense,
            income,
            balance: newBalance,
            note
        }
    })

    // Update account balance
    await prisma.ledgerAccount.update({
        where: { id: accountId },
        data: { balance: newBalance }
    })

    revalidatePath(`/inventory/ledger/${accountId}`)
    revalidatePath('/inventory/ledger')
    return { success: true }
}

// Update ledger transaction
export async function updateLedgerTransaction(transactionId: string, formData: FormData) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 거래를 수정할 수 있습니다." }
    }

    const transaction = await prisma.ledgerTransaction.findUnique({
        where: { id: transactionId }
    })

    if (!transaction) {
        return { error: "거래를 찾을 수 없습니다." }
    }

    const dateStr = formData.get('date') as string
    const description = formData.get('description') as string
    const expense = parseInt(formData.get('expense') as string) || 0
    const income = parseInt(formData.get('income') as string) || 0
    const note = formData.get('note') as string || null

    if (!dateStr || !description) {
        return { error: "날짜와 내역을 입력해주세요." }
    }

    // Update the transaction
    await prisma.ledgerTransaction.update({
        where: { id: transactionId },
        data: {
            date: new Date(dateStr),
            description,
            expense,
            income,
            note
        }
    })

    // Recalculate all balances for this account
    await recalculateLedgerBalances(transaction.accountId)

    revalidatePath(`/inventory/ledger/${transaction.accountId}`)
    revalidatePath('/inventory/ledger')
    return { success: true }
}

// Delete ledger transaction
export async function deleteLedgerTransaction(transactionId: string) {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: "관리자만 거래를 삭제할 수 있습니다." }
    }

    const transaction = await prisma.ledgerTransaction.findUnique({
        where: { id: transactionId }
    })

    if (!transaction) {
        return { error: "거래를 찾을 수 없습니다." }
    }

    const accountId = transaction.accountId

    await prisma.ledgerTransaction.delete({
        where: { id: transactionId }
    })

    // Recalculate all balances for this account
    await recalculateLedgerBalances(accountId)

    revalidatePath(`/inventory/ledger/${accountId}`)
    revalidatePath('/inventory/ledger')
    return { success: true }
}

// Recalculate all balances for an account (after update/delete)
async function recalculateLedgerBalances(accountId: string) {
    const transactions = await prisma.ledgerTransaction.findMany({
        where: { accountId },
        orderBy: { date: 'asc' }
    })

    let runningBalance = 0

    for (const tx of transactions) {
        runningBalance = runningBalance + tx.income - tx.expense
        await prisma.ledgerTransaction.update({
            where: { id: tx.id },
            data: { balance: runningBalance }
        })
    }

    // Update account balance
    await prisma.ledgerAccount.update({
        where: { id: accountId },
        data: { balance: runningBalance }
    })
}
