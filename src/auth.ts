import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Adapter } from "next-auth/adapters"
import type { JWT } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

function hasDatabaseUrl() {
    return Boolean(process.env.REAL_DATABASE_URL)
}

function shouldSkipAuthLocally() {
    return process.env.LOCAL_SKIP_AUTH === "true" && process.env.NODE_ENV !== "production"
}

const localPreviewSession = {
    user: {
        id: "local-preview-user",
        name: "Local Preview",
        email: "local-preview@example.com",
        image: null,
        role: "BS",
        isAdmin: false,
        isApproved: true,
        medalPoints: 0,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

async function syncTokenUser(token: JWT) {
    if (!hasDatabaseUrl()) {
        return token
    }

    const userId =
        typeof token.id === "string" && token.id
            ? token.id
            : typeof token.sub === "string" && token.sub
              ? token.sub
              : null

    if (!userId) {
        return token
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            isAdmin: true,
            isApproved: true,
            medalPoints: true,
        },
    })

    if (!dbUser) {
        return {
            ...token,
            id: userId,
            sub: userId,
            role: token.role ?? "BS",
            isAdmin: false,
            isApproved: false,
            medalPoints: 0,
        }
    }

    return {
        ...token,
        id: dbUser.id,
        sub: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        picture: dbUser.image,
        role: dbUser.role,
        isAdmin: dbUser.isAdmin,
        isApproved: dbUser.isApproved,
        medalPoints: dbUser.medalPoints,
    }
}

const nextAuth = NextAuth({
    adapter: PrismaAdapter(prisma) as Adapter,
    session: {
        strategy: "jwt",
    },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!hasDatabaseUrl()) {
                    return null
                }

                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                })

                if (!user || !user.password) {
                    return null
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                if (!isPasswordValid) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role: user.role,
                    isAdmin: user.isAdmin,
                    isApproved: user.isApproved,
                    medalPoints: user.medalPoints,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.sub = user.id
                token.email = user.email
                token.name = user.name
                token.picture = user.image
                token.role = user.role
                token.isAdmin = user.isAdmin
                token.isApproved = user.isApproved
                token.medalPoints = user.medalPoints
            }

            return syncTokenUser(token)
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = (token.id ?? token.sub) as string
                session.user.role = (token.role as string) || "BS"
                session.user.isAdmin = token.isAdmin as boolean
                session.user.isApproved = token.isApproved as boolean
                session.user.medalPoints = (token.medalPoints as number) || 0
            }

            return session
        },
    },
    pages: {
        signIn: "/login",
    },
})

export const { handlers, signIn, signOut } = nextAuth

export async function auth() {
    if (shouldSkipAuthLocally()) {
        return localPreviewSession as any
    }

    return nextAuth.auth()
}
