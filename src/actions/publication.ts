'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { isRateLimited } from '@/lib/rate-limit'

// ============ Public Actions ============

export async function getPublications(type?: string) {
    try {
        const where = type && type !== 'ALL' ? { type } : {}

        const publications = await prisma.publication.findMany({
            where,
            orderBy: [
                { year: 'desc' },
                { createdAt: 'desc' }
            ]
        })

        return publications
    } catch (error) {
        console.error('Failed to get publications:', error)
        return []
    }
}

export async function getHighlightedPublications() {
    try {
        const publications = await prisma.publication.findMany({
            where: { isHighlight: true },
            orderBy: { year: 'desc' },
            take: 5
        })

        return publications
    } catch (error) {
        console.error('Failed to get highlighted publications:', error)
        return []
    }
}

export async function getPublicationStats() {
    try {
        const [journals, conferences, patents] = await Promise.all([
            prisma.publication.count({ where: { type: 'JOURNAL' } }),
            prisma.publication.count({ where: { type: 'CONFERENCE' } }),
            prisma.publication.count({ where: { type: 'PATENT' } })
        ])

        return { journals, conferences, patents }
    } catch (error) {
        console.error('Failed to get publication stats:', error)
        return { journals: 0, conferences: 0, patents: 0 }
    }
}

// ============ Admin Actions ============

export async function createPublication(data: {
    type: string
    title: string
    authors: string
    year: number
    journal?: string
    volume?: string
    pages?: string
    doi?: string
    patentNo?: string
    link?: string
    isHighlight?: boolean
}) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        throw new Error('Unauthorized')
    }

    try {
        const publication = await prisma.publication.create({
            data: {
                type: data.type,
                title: data.title,
                authors: data.authors,
                year: data.year,
                journal: data.journal || null,
                volume: data.volume || null,
                pages: data.pages || null,
                doi: data.doi || null,
                patentNo: data.patentNo || null,
                link: data.link || null,
                isHighlight: data.isHighlight || false
            }
        })

        revalidatePath('/publications')
        revalidatePath('/admin')
        return publication
    } catch (error) {
        console.error('Failed to create publication:', error)
        throw new Error('Failed to create publication')
    }
}

export async function updatePublication(id: string, data: {
    type?: string
    title?: string
    authors?: string
    year?: number
    journal?: string
    volume?: string
    pages?: string
    doi?: string
    patentNo?: string
    link?: string
    isHighlight?: boolean
}) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        throw new Error('Unauthorized')
    }

    try {
        const publication = await prisma.publication.update({
            where: { id },
            data
        })

        revalidatePath('/publications')
        revalidatePath('/admin')
        return publication
    } catch (error) {
        console.error('Failed to update publication:', error)
        throw new Error('Failed to update publication')
    }
}

export async function deletePublication(id: string) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        throw new Error('Unauthorized')
    }

    try {
        await prisma.publication.delete({
            where: { id }
        })

        revalidatePath('/publications')
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete publication:', error)
        throw new Error('Failed to delete publication')
    }
}

// ============ Bulk Import ============

interface PublicationImport {
    type: string
    title: string
    authors: string
    year: number
    journal?: string
    volume?: string
    pages?: string
    doi?: string
    patentNo?: string
    link?: string
    isHighlight?: boolean
}

export async function bulkCreatePublications(publications: PublicationImport[]) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        return { error: '권한이 없습니다', created: 0, skipped: 0 }
    }

    // Rate limiting: 2 bulk imports per minute per admin
    if (isRateLimited(`bulk:${session.user.id}`, { maxRequests: 2, windowMs: 60 * 1000 })) {
        return { error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.', created: 0, skipped: 0 }
    }

    // Validate array size (max 100 items at once)
    if (!Array.isArray(publications) || publications.length === 0) {
        return { error: '유효한 논문 데이터가 없습니다', created: 0, skipped: 0 }
    }
    if (publications.length > 100) {
        return { error: '한 번에 최대 100개까지만 등록 가능합니다', created: 0, skipped: 0 }
    }

    try {
        let created = 0
        let skipped = 0
        const skippedTitles: string[] = []

        for (const pub of publications) {
            // Check for duplicate by title
            const existing = await prisma.publication.findFirst({
                where: { title: pub.title }
            })

            if (existing) {
                skipped++
                skippedTitles.push(pub.title.substring(0, 50) + '...')
                continue
            }

            // Validate required fields
            if (!pub.title || typeof pub.title !== 'string' || pub.title.trim().length === 0) {
                skipped++
                continue
            }
            if (!pub.authors || typeof pub.authors !== 'string') {
                skipped++
                continue
            }

            // Validate type
            const validTypes = ['JOURNAL', 'CONFERENCE']
            const type = pub.type?.toUpperCase() || 'JOURNAL'
            if (!validTypes.includes(type)) {
                skipped++
                continue
            }

            await prisma.publication.create({
                data: {
                    type,
                    title: pub.title,
                    authors: pub.authors,
                    year: pub.year || new Date().getFullYear(),
                    journal: pub.journal || null,
                    volume: pub.volume || null,
                    pages: pub.pages || null,
                    doi: pub.doi || null,
                    patentNo: pub.patentNo || null,
                    link: pub.link || null,
                    isHighlight: pub.isHighlight || false
                }
            })
            created++
        }

        revalidatePath('/publications')
        revalidatePath('/admin')

        return {
            success: true,
            created,
            skipped,
            skippedTitles: skippedTitles.slice(0, 5) // Show first 5 skipped
        }
    } catch (error) {
        console.error('Failed to bulk create publications:', error)
        return { error: '일괄 등록 중 오류가 발생했습니다', created: 0, skipped: 0 }
    }
}
