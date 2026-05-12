import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
    // Debug logging for Vercel deployment issues
    const dbUrl = process.env.REAL_DATABASE_URL
    // Always log for now to catch the error
    if (typeof window === 'undefined') {
        console.log('----------------------------------------')
        console.log('DEBUG: NODE_ENV:', process.env.NODE_ENV)
        console.log('DEBUG: REAL_DATABASE_URL exists:', !!dbUrl)
        if (dbUrl) console.log('DEBUG: REAL_DATABASE_URL prefix:', dbUrl.substring(0, 40))
        console.log('----------------------------------------')
    }

    globalForPrisma.prisma = prisma
}
