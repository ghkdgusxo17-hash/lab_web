import NextAuth, { DefaultSession } from "next-auth"

// Role and other type values (stored as strings in SQLite)
export type Role = "PROFESSOR" | "PHD" | "MS" | "BS" | "ALUMNI"
export type PostType = "NOTICE" | "FREE"
export type ResourceType = "EQUIPMENT" | "ROOM"
export type ReservationStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"

// Permission levels:
// Admin (isAdmin=true): Full access + user management
// Member (isApproved=true): Board posts, reservations
// Guest (isApproved=false): Free board only

export type ExtendedUser = DefaultSession["user"] & {
    id: string
    role: string
    isAdmin: boolean
    isApproved: boolean
}

declare module "next-auth" {
    interface Session {
        user: ExtendedUser
    }
    interface User {
        role: string
        isAdmin: boolean
        isApproved: boolean
    }
}
