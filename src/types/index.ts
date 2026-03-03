// User roles
export enum Role {
    PROFESSOR = 'PROFESSOR',
    PHD = 'PHD',
    MS = 'MS',
    BS = 'BS',
    ALUMNI = 'ALUMNI',
}

export const RoleLabels: Record<Role, string> = {
    [Role.PROFESSOR]: '교수',
    [Role.PHD]: '박사과정',
    [Role.MS]: '석사과정',
    [Role.BS]: '학부연구생',
    [Role.ALUMNI]: '졸업생',
}

// Post types
export enum PostType {
    NOTICE = 'NOTICE',
    FREE = 'FREE',
}

export const PostTypeLabels: Record<PostType, string> = {
    [PostType.NOTICE]: '공지사항',
    [PostType.FREE]: '자유게시판',
}

// Resource types
export enum ResourceType {
    EQUIPMENT = 'EQUIPMENT',
    ROOM = 'ROOM',
}

export const ResourceTypeLabels: Record<ResourceType, string> = {
    [ResourceType.EQUIPMENT]: '장비',
    [ResourceType.ROOM]: '공간',
}

// Reservation status
export enum ReservationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

export const ReservationStatusLabels: Record<ReservationStatus, string> = {
    [ReservationStatus.PENDING]: '대기중',
    [ReservationStatus.APPROVED]: '승인됨',
    [ReservationStatus.REJECTED]: '거절됨',
    [ReservationStatus.CANCELLED]: '취소됨',
}

// User type
export interface User {
    id: string
    name: string
    email: string
    role: Role
    bio?: string
    image?: string
    researchInterests?: string[]
    joinedAt: Date
    graduatedAt?: Date
}

// Post type
export interface Post {
    id: string
    title: string
    content: string
    type: PostType
    author: User
    createdAt: Date
    updatedAt: Date
    isPinned: boolean
}

// Resource type
export interface Resource {
    id: string
    name: string
    description?: string
    type: ResourceType
    image?: string
    isAvailable: boolean
}

// Reservation type
export interface Reservation {
    id: string
    resource: Resource
    user: User
    startTime: Date
    endTime: Date
    status: ReservationStatus
    purpose?: string
    createdAt: Date
}

// Event type
export interface CalendarEvent {
    id: string
    title: string
    description?: string
    startTime: Date
    endTime: Date
    isAllDay: boolean
    isImportant?: boolean
    category?: string
    color?: string
    createdBy: User
    createdAt: Date
}
