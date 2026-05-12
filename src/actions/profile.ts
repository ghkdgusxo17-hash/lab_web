'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

// Get current user profile
export async function getMyProfile() {
    const session = await auth()
    if (!session?.user?.id) {
        return null
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            researchInterests: true,
        }
    })

    return user
}

// Update own profile
export async function updateMyProfile(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "로그인이 필요합니다." }
    }

    const name = formData.get("name") as string || null
    const bio = formData.get("bio") as string || null
    const researchInterests = formData.get("researchInterests") as string || null
    const imageValue = formData.get("image") as string
    // If image is empty string, set to null (for deletion)
    // If image has value, use it
    // If image is not provided, don't update (undefined)
    const image = imageValue === '' ? null : (imageValue || undefined)

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            name: name || undefined,
            bio,
            researchInterests,
            image,
        }
    })

    revalidatePath("/members")
    revalidatePath("/settings")
    return { success: true }
}

