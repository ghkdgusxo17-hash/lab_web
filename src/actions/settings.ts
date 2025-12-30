'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function getSiteSettings() {
    try {
        let settings = await prisma.siteSettings.findUnique({
            where: { id: 'main' }
        })

        // Create default settings if not exists
        if (!settings) {
            settings = await prisma.siteSettings.create({
                data: { id: 'main', videoEnabled: false }
            })
        }

        return settings
    } catch (error) {
        console.error('Error fetching site settings:', error)
        return { id: 'main', videoEnabled: false, updatedAt: new Date() }
    }
}

export async function toggleVideoEnabled() {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return { error: '권한이 없습니다' }
    }

    try {
        const current = await getSiteSettings()

        const updated = await prisma.siteSettings.upsert({
            where: { id: 'main' },
            update: { videoEnabled: !current.videoEnabled },
            create: { id: 'main', videoEnabled: true }
        })

        revalidatePath('/about')
        revalidatePath('/admin')

        return { success: true, videoEnabled: updated.videoEnabled }
    } catch (error) {
        console.error('Error toggling video setting:', error)
        return { error: '설정 변경 중 오류가 발생했습니다' }
    }
}
