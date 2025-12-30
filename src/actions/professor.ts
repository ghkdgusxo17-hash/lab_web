'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { STORAGE_BUCKET } from '@/lib/storage-constants'

// Types for education and career entries
export interface EducationEntry {
    degree: string    // 학사, 석사, 박사
    school: string
    major: string
    year: string
    thesis?: string   // 논문 제목
    advisor?: string  // 지도교수
}

export interface CareerEntry {
    position: string
    organization: string
    period: string
    description?: string  // 부서/세부사항
}

export interface AcademicActivityEntry {
    category: string  // 예: Editorial board members
    items: string[]   // 세부 항목들
}

export interface AwardEntry {
    title: string
    year: string
}

export interface ProfessorInfoData {
    id: string
    name: string
    position: string
    department: string
    university: string
    address: string
    profileImage: string | null
    email: string
    phone: string
    fax: string
    labLocation: string
    education: EducationEntry[]
    career: CareerEntry[]
    academicActivities: AcademicActivityEntry[]
    awards: AwardEntry[]
    researchKeywords: string[]
    researchDescription: string
    updatedAt: Date
}

// Get professor info (public)
export async function getProfessorInfo(): Promise<ProfessorInfoData> {
    try {
        let info = await prisma.professorInfo.findUnique({
            where: { id: 'main' }
        })

        // Create default record if not exists
        if (!info) {
            info = await prisma.professorInfo.create({
                data: { id: 'main' }
            })
        }

        // Parse JSON strings to arrays
        return {
            ...info,
            education: JSON.parse(info.education || '[]') as EducationEntry[],
            career: JSON.parse(info.career || '[]') as CareerEntry[],
            academicActivities: JSON.parse(info.academicActivities || '[]') as AcademicActivityEntry[],
            awards: JSON.parse(info.awards || '[]') as AwardEntry[],
            researchKeywords: JSON.parse(info.researchKeywords || '[]') as string[]
        }
    } catch (error) {
        console.error('Failed to get professor info:', error)
        // Return default values on error
        return {
            id: 'main',
            name: '교수명',
            position: '부교수',
            department: '생명화학공학과',
            university: '강원대학교',
            address: '',
            profileImage: null,
            email: '',
            phone: '',
            fax: '',
            labLocation: '',
            education: [],
            career: [],
            academicActivities: [],
            awards: [],
            researchKeywords: [],
            researchDescription: '',
            updatedAt: new Date()
        }
    }
}

// Update professor info (admin only)
export async function updateProfessorInfo(data: {
    name?: string
    position?: string
    department?: string
    university?: string
    address?: string
    profileImage?: string | null
    email?: string
    phone?: string
    fax?: string
    labLocation?: string
    education?: EducationEntry[]
    career?: CareerEntry[]
    academicActivities?: AcademicActivityEntry[]
    awards?: AwardEntry[]
    researchKeywords?: string[]
    researchDescription?: string
}): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await auth()

        if (!session?.user?.isAdmin) {
            return { success: false, error: '관리자 권한이 필요합니다.' }
        }

        // Prepare data with JSON serialization
        const updateData: Record<string, any> = {}

        if (data.name !== undefined) updateData.name = data.name
        if (data.position !== undefined) updateData.position = data.position
        if (data.department !== undefined) updateData.department = data.department
        if (data.university !== undefined) updateData.university = data.university
        if (data.address !== undefined) updateData.address = data.address
        if (data.profileImage !== undefined) updateData.profileImage = data.profileImage
        if (data.email !== undefined) updateData.email = data.email
        if (data.phone !== undefined) updateData.phone = data.phone
        if (data.fax !== undefined) updateData.fax = data.fax
        if (data.labLocation !== undefined) updateData.labLocation = data.labLocation
        if (data.education !== undefined) updateData.education = JSON.stringify(data.education)
        if (data.career !== undefined) updateData.career = JSON.stringify(data.career)
        if (data.academicActivities !== undefined) updateData.academicActivities = JSON.stringify(data.academicActivities)
        if (data.awards !== undefined) updateData.awards = JSON.stringify(data.awards)
        if (data.researchKeywords !== undefined) updateData.researchKeywords = JSON.stringify(data.researchKeywords)
        if (data.researchDescription !== undefined) updateData.researchDescription = data.researchDescription

        await prisma.professorInfo.upsert({
            where: { id: 'main' },
            update: updateData,
            create: {
                id: 'main',
                ...updateData
            }
        })

        revalidatePath('/professor')
        revalidatePath('/about')
        revalidatePath('/admin')

        return { success: true }
    } catch (error) {
        console.error('Failed to update professor info:', error)
        return { success: false, error: '교수 정보 업데이트에 실패했습니다.' }
    }
}

// Upload professor profile image (admin only)
export async function uploadProfessorImage(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const session = await auth()

        if (!session?.user?.isAdmin) {
            return { success: false, error: '관리자 권한이 필요합니다.' }
        }

        const file = formData.get('file') as File

        if (!file) {
            return { success: false, error: '파일을 선택해주세요.' }
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return { success: false, error: '이미지 파일만 업로드할 수 있습니다.' }
        }

        // Generate unique filename
        const timestamp = Date.now()
        const ext = file.name.split('.').pop()
        const filename = `professor_${timestamp}.${ext}`
        const filePath = `professor/${filename}`

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
            return { success: false, error: '이미지 업로드 중 오류가 발생했습니다.' }
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath)

        // Delete old image if exists
        const oldInfo = await prisma.professorInfo.findUnique({
            where: { id: 'main' },
            select: { profileImage: true }
        })

        if (oldInfo?.profileImage) {
            const parts = oldInfo.profileImage.split(`/storage/v1/object/public/${STORAGE_BUCKET}/`)
            if (parts.length > 1) {
                await supabaseAdmin.storage
                    .from(STORAGE_BUCKET)
                    .remove([parts[1]])
            }
        }

        // Update professor info with new image URL
        await prisma.professorInfo.upsert({
            where: { id: 'main' },
            update: { profileImage: urlData.publicUrl },
            create: { id: 'main', profileImage: urlData.publicUrl }
        })

        revalidatePath('/professor')
        revalidatePath('/admin')

        return { success: true, url: urlData.publicUrl }
    } catch (error) {
        console.error('Failed to upload professor image:', error)
        return { success: false, error: '이미지 업로드에 실패했습니다.' }
    }
}
