'use client'

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/ThemeProvider"

export function Providers({
    children,
    guestForcesLight = false,
}: {
    children: React.ReactNode
    guestForcesLight?: boolean
}) {
    return (
        <SessionProvider>
            <ThemeProvider guestForcesLight={guestForcesLight}>
                {children}
            </ThemeProvider>
        </SessionProvider>
    )
}
