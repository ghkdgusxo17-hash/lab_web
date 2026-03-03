'use server'

import { prisma } from "@/lib/prisma"
import { auth, signIn, signOut } from "@/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { STORAGE_BUCKET, extractStoragePath } from "@/lib/storage-constants"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function signOutAction() {
    await signOut({ redirectTo: "/" })
}

export async function signInWithCredentials(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/",
        })
    } catch (error) {
        throw error
    }
}

export async function registerUser(formData: FormData) {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!name || !email || !password) {
        return { error: "모든 필드를 입력해주세요." }
    }

    if (password.length < 6) {
        return { error: "비밀번호는 최소 6자 이상이어야 합니다." }
    }

    const existingUser = await prisma.user.findUnique({
        where: { email },
    })

    if (existingUser) {
        return { error: "이미 등록된 이메일입니다." }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: "BS",
            isAdmin: false,
            isApproved: false, // New users start as Guest
        },
    })

    return { success: true }
}

// Admin only functions
export async function getAllUsers() {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            isAdmin: true,
            isApproved: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    })

    return { users }
}

export async function updateUserRole(userId: string, role: string) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    const validRoles = ["PROFESSOR", "PHD", "MS", "BS", "ALUMNI"]
    if (!validRoles.includes(role)) {
        return { error: "유효하지 않은 역할입니다." }
    }

    await prisma.user.update({
        where: { id: userId },
        data: { role },
    })

    revalidatePath("/admin")
    return { success: true }
}

export async function toggleUserAdmin(userId: string) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    if (session.user.id === userId) {
        return { error: "자신의 관리자 권한은 변경할 수 없습니다." }
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
    })

    if (!user) {
        return { error: "사용자를 찾을 수 없습니다." }
    }

    await prisma.user.update({
        where: { id: userId },
        data: { isAdmin: !user.isAdmin },
    })

    revalidatePath("/admin")
    return { success: true }
}

export async function toggleUserApproval(userId: string) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
    })

    if (!user) {
        return { error: "사용자를 찾을 수 없습니다." }
    }

    await prisma.user.update({
        where: { id: userId },
        data: { isApproved: !user.isApproved },
    })

    revalidatePath("/admin")
    return { success: true }
}

// Get single user by ID (Admin only)
export async function getUserById(userId: string) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        return null
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            bio: true,
            researchInterests: true,
            isAdmin: true,
            isApproved: true,
            joinedAt: true,
            graduatedAt: true,
            currentCompany: true,
            currentPosition: true,
            degreeObtained: true,
        }
    })

    return user
}

// Update user profile (Admin only)
export async function updateUserProfile(userId: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as string
    const bio = formData.get("bio") as string || null
    const researchInterests = formData.get("researchInterests") as string || null
    const image = formData.get("image") as string || null

    // Alumni fields
    const graduatedAtStr = formData.get("graduatedAt") as string
    const currentCompany = formData.get("currentCompany") as string || null
    const currentPosition = formData.get("currentPosition") as string || null
    const degreeObtained = formData.get("degreeObtained") as string || null

    if (!name || !email) {
        return { error: "이름과 이메일은 필수입니다." }
    }

    const validRoles = ["PROFESSOR", "PHD", "MS", "BS", "ALUMNI"]
    if (!validRoles.includes(role)) {
        return { error: "유효하지 않은 역할입니다." }
    }

    // Check if email is taken by another user
    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (existingUser && existingUser.id !== userId) {
        return { error: "이미 사용 중인 이메일입니다." }
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            name,
            email,
            role,
            bio,
            researchInterests,
            image,
            // Alumni fields (only set if role is ALUMNI)
            graduatedAt: role === 'ALUMNI' && graduatedAtStr ? new Date(graduatedAtStr + '-01') : null,
            currentCompany: role === 'ALUMNI' ? currentCompany : null,
            currentPosition: role === 'ALUMNI' ? currentPosition : null,
            degreeObtained: role === 'ALUMNI' ? degreeObtained : null,
        }
    })

    revalidatePath("/admin")
    revalidatePath("/admin/users")
    revalidatePath("/members")
    return { success: true }
}

// Create new user (Admin only)
export async function createUser(formData: FormData) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as string
    const bio = formData.get("bio") as string || null
    const researchInterests = formData.get("researchInterests") as string || null
    const password = formData.get("password") as string

    if (!name || !email || !password) {
        return { error: "이름, 이메일, 비밀번호는 필수입니다." }
    }

    if (password.length < 6) {
        return { error: "비밀번호는 최소 6자 이상이어야 합니다." }
    }

    const validRoles = ["PROFESSOR", "PHD", "MS", "BS", "ALUMNI"]
    if (!validRoles.includes(role)) {
        return { error: "유효하지 않은 역할입니다." }
    }

    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (existingUser) {
        return { error: "이미 사용 중인 이메일입니다." }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
            bio,
            researchInterests,
            isAdmin: false,
            isApproved: true, // Admin-created users are approved by default
        }
    })

    revalidatePath("/admin")
    revalidatePath("/members")
    return { success: true, userId: user.id }
}

// Delete user (Admin only)
export async function deleteUser(userId: string) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        return { error: "권한이 없습니다." }
    }

    if (session.user.id === userId) {
        return { error: "자기 자신은 삭제할 수 없습니다." }
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { image: true }
    })

    if (user?.image) {
        const storagePath = extractStoragePath(user.image)
        if (storagePath) {
            await supabaseAdmin.storage
                .from(STORAGE_BUCKET)
                .remove([storagePath])
        }
    }

    await prisma.user.delete({
        where: { id: userId }
    })

    revalidatePath("/admin")
    revalidatePath("/members")
    return { success: true }
}
