'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const WRITER_ROLES = ['PHD', 'MS', 'BS'] as const
const NOTE_THEMES = ['SKY', 'CYAN', 'MINT', 'SLATE'] as const

type WriterRole = (typeof WRITER_ROLES)[number]
type NoteTheme = (typeof NOTE_THEMES)[number]

const ROLE_LABELS: Record<WriterRole, string> = {
  PHD: '박사과정',
  MS: '석사과정',
  BS: '학부연구생',
}

function isWritableRole(role: string): role is WriterRole {
  return WRITER_ROLES.includes(role as WriterRole)
}

function isValidTheme(theme: string): theme is NoteTheme {
  return NOTE_THEMES.includes(theme as NoteTheme)
}

function canManageLabNote(user: { role?: string | null; isApproved?: boolean | null }) {
  return Boolean(user.isApproved && user.role && isWritableRole(user.role))
}

function serializeDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null
}

export interface MyLabNoteSettingsData {
  canManage: boolean
  defaultDisplayLabel: string
  note: {
    draftDisplayLabel: string | null
    draftContent: string | null
    draftTheme: NoteTheme
    publicDisplayLabel: string | null
    publicContent: string | null
    publicTheme: NoteTheme
    status: string
    adminComment: string | null
    lastSubmittedAt: string | null
    approvedAt: string | null
    updatedAt: string | null
  } | null
}

export interface PublicLabNote {
  id: string
  displayLabel: string
  content: string
  theme: NoteTheme
  role: string
  authorName: string | null
  approvedAt: string | null
}

export interface AdminLabNote {
  id: string
  status: string
  draftDisplayLabel: string | null
  draftContent: string | null
  draftTheme: NoteTheme
  publicDisplayLabel: string | null
  publicContent: string | null
  publicTheme: NoteTheme
  adminComment: string | null
  lastSubmittedAt: string | null
  approvedAt: string | null
  updatedAt: string | null
  user: {
    id: string
    name: string | null
    role: string
    image: string | null
  }
}

export async function getMyLabNoteSettings(): Promise<MyLabNoteSettingsData> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      canManage: false,
      defaultDisplayLabel: '연구생',
      note: null,
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      isApproved: true,
      labNote: {
        select: {
          draftDisplayLabel: true,
          draftContent: true,
          draftTheme: true,
          publicDisplayLabel: true,
          publicContent: true,
          publicTheme: true,
          status: true,
          adminComment: true,
          lastSubmittedAt: true,
          approvedAt: true,
          updatedAt: true,
        },
      },
    },
  })

  const defaultDisplayLabel =
    user?.role && isWritableRole(user.role) ? ROLE_LABELS[user.role] : '연구생'

  return {
    canManage: user ? canManageLabNote(user) : false,
    defaultDisplayLabel,
    note: user?.labNote
      ? {
          draftDisplayLabel: user.labNote.draftDisplayLabel,
          draftContent: user.labNote.draftContent,
          draftTheme: isValidTheme(user.labNote.draftTheme) ? user.labNote.draftTheme : 'SKY',
          publicDisplayLabel: user.labNote.publicDisplayLabel,
          publicContent: user.labNote.publicContent,
          publicTheme: isValidTheme(user.labNote.publicTheme) ? user.labNote.publicTheme : 'SKY',
          status: user.labNote.status,
          adminComment: user.labNote.adminComment,
          lastSubmittedAt: serializeDate(user.labNote.lastSubmittedAt),
          approvedAt: serializeDate(user.labNote.approvedAt),
          updatedAt: serializeDate(user.labNote.updatedAt),
        }
      : null,
  }
}

export async function saveMyLabNote(input: {
  displayLabel: string
  content: string
  theme: string
}) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: '로그인이 필요합니다.' }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      isApproved: true,
    },
  })

  if (!user || !canManageLabNote(user)) {
    return { error: '승인된 연구생만 선배 메모를 작성할 수 있습니다.' }
  }

  const displayLabel = input.displayLabel.trim().slice(0, 24)
  const content = input.content.trim().replace(/\s+/g, ' ').slice(0, 60)
  const theme = input.theme.trim().toUpperCase()
  const now = new Date()

  if (!displayLabel) {
    return { error: '표시 이름을 입력해주세요.' }
  }

  if (content.length < 8) {
    return { error: '메모는 8자 이상 적어주세요.' }
  }

  if (!isValidTheme(theme)) {
    return { error: '메모 색상을 다시 선택해주세요.' }
  }

  await prisma.labNote.upsert({
    where: { userId: user.id },
    update: {
      draftDisplayLabel: displayLabel,
      draftContent: content,
      draftTheme: theme,
      publicDisplayLabel: displayLabel,
      publicContent: content,
      publicTheme: theme,
      status: 'APPROVED',
      adminComment: null,
      lastSubmittedAt: now,
      approvedAt: now,
    },
    create: {
      userId: user.id,
      draftDisplayLabel: displayLabel,
      draftContent: content,
      draftTheme: theme,
      publicDisplayLabel: displayLabel,
      publicContent: content,
      publicTheme: theme,
      status: 'APPROVED',
      adminComment: null,
      lastSubmittedAt: now,
      approvedAt: now,
    },
  })

  revalidatePath('/settings')
  revalidatePath('/aptitude-test')
  revalidatePath('/admin')

  return { success: true }
}

export async function getPublicLabNotes(): Promise<PublicLabNote[]> {
  const notes = await prisma.labNote.findMany({
    where: {
      status: 'APPROVED',
      publicContent: { not: null },
      user: {
        isApproved: true,
        role: { in: [...WRITER_ROLES] },
      },
    },
    select: {
      id: true,
      publicDisplayLabel: true,
      publicContent: true,
      publicTheme: true,
      approvedAt: true,
      user: {
        select: {
          name: true,
          role: true,
        },
      },
    },
    orderBy: [{ approvedAt: 'desc' }, { updatedAt: 'desc' }],
  })

  return notes.map((note) => {
    const role = isWritableRole(note.user.role) ? note.user.role : 'BS'
    return {
      id: note.id,
      displayLabel: note.publicDisplayLabel || ROLE_LABELS[role],
      content: note.publicContent || '',
      theme: isValidTheme(note.publicTheme) ? note.publicTheme : 'SKY',
      role,
      authorName: note.user.name,
      approvedAt: serializeDate(note.approvedAt),
    }
  })
}

export async function getLabNotesForAdmin(): Promise<AdminLabNote[]> {
  const session = await auth()

  if (!session?.user?.isAdmin) {
    return []
  }

  const notes = await prisma.labNote.findMany({
    where: {
      user: {
        role: { in: [...WRITER_ROLES] },
      },
    },
    select: {
      id: true,
      status: true,
      draftDisplayLabel: true,
      draftContent: true,
      draftTheme: true,
      publicDisplayLabel: true,
      publicContent: true,
      publicTheme: true,
      adminComment: true,
      lastSubmittedAt: true,
      approvedAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          image: true,
        },
      },
    },
    orderBy: [{ updatedAt: 'desc' }],
  })

  return notes.map((note) => ({
    id: note.id,
    status: note.status,
    draftDisplayLabel: note.draftDisplayLabel,
    draftContent: note.draftContent,
    draftTheme: isValidTheme(note.draftTheme) ? note.draftTheme : 'SKY',
    publicDisplayLabel: note.publicDisplayLabel,
    publicContent: note.publicContent,
    publicTheme: isValidTheme(note.publicTheme) ? note.publicTheme : 'SKY',
    adminComment: note.adminComment,
    lastSubmittedAt: serializeDate(note.lastSubmittedAt),
    approvedAt: serializeDate(note.approvedAt),
    updatedAt: serializeDate(note.updatedAt),
    user: {
      id: note.user.id,
      name: note.user.name,
      role: note.user.role,
      image: note.user.image,
    },
  }))
}

export async function approveLabNote() {
  return { error: '선배 메모는 이제 저장 즉시 공개됩니다.' }
}

export async function requestLabNoteRevision() {
  return { error: '선배 메모 검토 모드는 사용하지 않습니다.' }
}
