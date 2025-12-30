
'use server'

import { prisma } from "@/lib/prisma"
import { sendResetEmail } from "@/lib/email"
import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"

export async function requestPasswordReset(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            // Return success even if user doesn't exist to prevent email enumeration
            return { success: true, message: "If an account exists, a reset link has been sent." }
        }

        // Generate token
        const token = randomBytes(32).toString("hex")
        const expires = new Date(Date.now() + 3600 * 1000) // 1 hour

        // Save token (delete existing if any)
        await prisma.verificationToken.deleteMany({
            where: { identifier: email },
        })

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires,
            },
        })

        // Send Email
        await sendResetEmail(email, token)

        return { success: true, message: "Reset link sent to your email." }
    } catch (error) {
        console.error("Password reset request error:", error)
        return { success: false, message: "Something went wrong." }
    }
}

export async function resetPassword(token: string, newPassword: string) {
    try {
        const storedToken = await prisma.verificationToken.findUnique({
            where: { token },
        })

        if (!storedToken) {
            return { success: false, message: "Invalid token." }
        }

        if (new Date() > storedToken.expires) {
            await prisma.verificationToken.delete({ where: { token } })
            return { success: false, message: "Token expired." }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await prisma.user.update({
            where: { email: storedToken.identifier },
            data: { password: hashedPassword },
        })

        await prisma.verificationToken.delete({
            where: { token },
        })

        return { success: true, message: "Password updated successfully." }
    } catch (error) {
        console.error("Password reset error:", error)
        return { success: false, message: "Failed to reset password." }
    }
}
