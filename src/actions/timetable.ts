'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { parseTimetablePdf, assignCourseColors } from '@/lib/timetable-parser'
import type { ParsedCourse } from '@/lib/timetable-parser'

// 현재 학기 문자열 반환
function getCurrentSemester(): string {
  const now = new Date()
  const year = now.getFullYear()
  const sem = now.getMonth() < 7 ? 1 : 2
  return `${year}-${sem}`
}

// 전체 멤버의 시간표 목록 조회
export async function getTimetables() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('로그인이 필요합니다.')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isApproved: true },
  })
  if (!user?.isApproved) throw new Error('승인된 멤버만 접근 가능합니다.')

  const timetables = await prisma.timetable.findMany({
    include: {
      user: {
        select: { id: true, name: true, image: true, role: true },
      },
      entries: true,
    },
    orderBy: { user: { name: 'asc' } },
  })

  return timetables
}

// 특정 멤버의 시간표 조회
export async function getTimetable(userId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('로그인이 필요합니다.')

  const timetable = await prisma.timetable.findUnique({
    where: { userId },
    include: {
      user: {
        select: { id: true, name: true, image: true, role: true },
      },
      entries: true,
    },
  })

  return timetable
}

// 내 시간표 저장
export async function saveTimetable(
  entries: {
    dayOfWeek: number
    startTime: string
    endTime: string
    courseName: string
    professor?: string | null
    room?: string | null
    color?: string | null
  }[]
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('로그인이 필요합니다.')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isApproved: true },
  })
  if (!user?.isApproved) throw new Error('승인된 멤버만 시간표를 등록할 수 있습니다.')

  const semester = getCurrentSemester()

  // 색상 자동 배정
  const colorMap = assignCourseColors(entries as ParsedCourse[])

  // 기존 시간표 삭제 후 새로 생성 (upsert)
  await prisma.$transaction(async (tx) => {
    // 기존 시간표 삭제
    await tx.timetable.deleteMany({
      where: { userId: session.user!.id },
    })

    // 새 시간표 생성
    await tx.timetable.create({
      data: {
        userId: session.user!.id,
        semester,
        entries: {
          create: entries.map((entry) => ({
            dayOfWeek: entry.dayOfWeek,
            startTime: entry.startTime,
            endTime: entry.endTime,
            courseName: entry.courseName,
            professor: entry.professor || null,
            room: entry.room || null,
            color: entry.color || colorMap.get(entry.courseName) || null,
          })),
        },
      },
    })
  })

  revalidatePath('/timetable')
  return { success: true }
}

// 시간표 수정 (관리자용)
export async function updateTimetable(
  userId: string,
  entries: {
    dayOfWeek: number
    startTime: string
    endTime: string
    courseName: string
    professor?: string | null
    room?: string | null
    color?: string | null
  }[]
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('로그인이 필요합니다.')

  // 본인이거나 관리자만 수정 가능
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })

  if (session.user.id !== userId && !currentUser?.isAdmin) {
    throw new Error('시간표를 수정할 권한이 없습니다.')
  }

  const semester = getCurrentSemester()
  const colorMap = assignCourseColors(entries as ParsedCourse[])

  await prisma.$transaction(async (tx) => {
    await tx.timetable.deleteMany({
      where: { userId },
    })

    await tx.timetable.create({
      data: {
        userId,
        semester,
        entries: {
          create: entries.map((entry) => ({
            dayOfWeek: entry.dayOfWeek,
            startTime: entry.startTime,
            endTime: entry.endTime,
            courseName: entry.courseName,
            professor: entry.professor || null,
            room: entry.room || null,
            color: entry.color || colorMap.get(entry.courseName) || null,
          })),
        },
      },
    })
  })

  revalidatePath('/timetable')
  return { success: true }
}

// 시간표 삭제
export async function deleteTimetable(userId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('로그인이 필요합니다.')

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })

  if (session.user.id !== userId && !currentUser?.isAdmin) {
    throw new Error('시간표를 삭제할 권한이 없습니다.')
  }

  await prisma.timetable.deleteMany({
    where: { userId },
  })

  revalidatePath('/timetable')
  return { success: true }
}

// PDF 업로드 → 파싱 → 미리보기 데이터 반환 (저장 전)
export async function parseTimetablePdfAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('로그인이 필요합니다.')

  const file = formData.get('file') as File
  if (!file) throw new Error('PDF 파일을 선택해주세요.')

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('PDF 파일만 업로드 가능합니다.')
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('파일 크기는 10MB 이하여야 합니다.')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await parseTimetablePdf(buffer)

  return result
}

// 승인된 멤버 목록 (시간표 등록 여부 포함)
export async function getMembersWithTimetableStatus() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('로그인이 필요합니다.')

  const members = await prisma.user.findMany({
    where: { isApproved: true },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
      timetable: {
        select: {
          id: true,
          semester: true,
          updatedAt: true,
          entries: { select: { courseName: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return members.map((m) => ({
    id: m.id,
    name: m.name,
    image: m.image,
    role: m.role,
    hasTimetable: !!m.timetable,
    timetableSemester: m.timetable?.semester || null,
    entryCount: m.timetable ? new Set(m.timetable.entries.map(e => e.courseName)).size : 0,
    updatedAt: m.timetable?.updatedAt || null,
  }))
}
