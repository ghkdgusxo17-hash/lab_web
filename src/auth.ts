import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Adapter } from "next-auth/adapters"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        async jwt({ token, user, trigger }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.isAdmin = user.isAdmin
                token.isApproved = user.isApproved
                token.medalPoints = user.medalPoints
            }
            // Refresh user data from DB on each request to get latest permissions
            if (trigger === "update" || !token.isApproved) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                })
                if (dbUser) {
                    token.isAdmin = dbUser.isAdmin
                    token.isApproved = dbUser.isApproved
                    token.role = dbUser.role
                    token.name = dbUser.name
                    token.picture = dbUser.image
                    token.medalPoints = dbUser.medalPoints
                }
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.isAdmin = token.isAdmin as boolean
                session.user.isApproved = token.isApproved as boolean
                session.user.medalPoints = (token.medalPoints as number) || 0
            }
            return session
        },
    },
    pages: {
        signIn: '/login',
    },
})
