'use client'

import { useState, useMemo } from 'react'
import { Session } from 'next-auth'
import Link from 'next/link'
import { ArrowLeft, Edit2, Users, Clock, Check } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'

const DAYS = ['월', '화', '수', '목', '금', '토']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8) // 08:00 ~ 21:00
const CELL_HEIGHT = 60 // 1시간 = 60px
const GRID_START = 8 // 08:00 시작

const COURSE_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-200 dark:border-blue-800' },
  { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-800 dark:text-green-200', border: 'border-green-200 dark:border-green-800' },
  { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-200 dark:border-amber-800' },
  { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-200', border: 'border-red-200 dark:border-red-800' },
  { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-200 dark:border-purple-800' },
  { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-800 dark:text-pink-200', border: 'border-pink-200 dark:border-pink-800' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-800 dark:text-cyan-200', border: 'border-cyan-200 dark:border-cyan-800' },
  { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-200 dark:border-orange-800' },
]

interface TimetableEntry {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  courseName: string
  professor: string | null
  room: string | null
  color: string | null
}

interface Timetable {
  id: string
  userId: string
  semester: string
  user: {
    id: string
    name: string | null
    image: string | null
    role: string
  }
  entries: TimetableEntry[]
}

interface Member {
  id: string
  name: string | null
  image: string | null
  role: string
  hasTimetable: boolean
  entryCount: number
}

interface TimetableClientProps {
  session: Session
  timetables: Timetable[]
  members: Member[]
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function TimetableClient({ session, timetables, members }: TimetableClientProps) {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const isCompareMode = selectedMembers.length >= 2
  const isSingleMode = selectedMembers.length === 1

  // 선택된 멤버들의 시간표
  const selectedTimetables = useMemo(() => {
    return timetables.filter(t => selectedMembers.includes(t.userId))
  }, [timetables, selectedMembers])

  // 과목별 색상 매핑 (전역)
  const courseColorMap = useMemo(() => {
    const map = new Map<string, typeof COURSE_COLORS[0]>()
    let colorIdx = 0
    for (const t of timetables) {
      for (const e of t.entries) {
        if (!map.has(e.courseName)) {
          map.set(e.courseName, COURSE_COLORS[colorIdx % COURSE_COLORS.length])
          colorIdx++
        }
      }
    }
    return map
  }, [timetables])

  // 공강 시간 계산 (30분 단위)
  const freeSlots = useMemo(() => {
    if (!isCompareMode) return new Set<string>()

    const busySlots = new Set<string>()
    for (const t of selectedTimetables) {
      for (const e of t.entries) {
        const startMin = timeToMinutes(e.startTime)
        const endMin = timeToMinutes(e.endTime)
        for (let m = startMin; m < endMin; m += 30) {
          busySlots.add(`${e.dayOfWeek}-${m}`)
        }
      }
    }

    const free = new Set<string>()
    for (let day = 0; day < 6; day++) {
      for (let hour = 9; hour < 18; hour++) {
        for (let m = 0; m < 60; m += 30) {
          const min = hour * 60 + m
          const key = `${day}-${min}`
          if (!busySlots.has(key)) {
            free.add(key)
          }
        }
      }
    }
    return free
  }, [selectedTimetables, isCompareMode])

  const toggleMember = (id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    const membersWithTimetable = members.filter(m => m.hasTimetable).map(m => m.id)
    setSelectedMembers(membersWithTimetable)
  }

  const clearSelection = () => setSelectedMembers([])

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <Link href="/calendar" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            캘린더
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
            시간표
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">
            멤버들의 수업 시간표를 확인하고 공강 시간을 비교하세요
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/timetable/edit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            내 시간표 편집
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* 멤버 목록 (왼쪽 사이드바) */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm sticky top-28">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                멤버
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={selectAll}
                  className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                >
                  전체
                </button>
                <button
                  onClick={clearSelection}
                  className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                >
                  해제
                </button>
              </div>
            </div>

            <div className="space-y-1">
              {members.map(member => {
                const isSelected = selectedMembers.includes(member.id)
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    disabled={!member.hasTimetable}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800'
                        : member.hasTimetable
                        ? 'hover:bg-slate-50 dark:hover:bg-slate-800'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="relative">
                      <UserAvatar src={member.image} name={member.name} size={28} />
                      {isSelected && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {member.name || '이름 없음'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {member.hasTimetable ? `${member.entryCount}과목` : '미등록'}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {isCompareMode && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-sm font-medium text-green-800 dark:text-green-200">
                  공강 비교 모드
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {selectedMembers.length}명 선택 · 초록색 = 공통 빈 시간
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 시간표 그리드 (오른쪽) */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm overflow-x-auto">
            {selectedMembers.length === 0 ? (
              <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">멤버를 선택하면 시간표가 표시됩니다</p>
                <p className="text-sm mt-2">왼쪽에서 멤버를 클릭하세요. 2명 이상 선택하면 공강 비교가 가능합니다.</p>
              </div>
            ) : (
              <>
                {isSingleMode && (
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedTimetables[0]?.user.name}의 시간표
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedTimetables[0]?.semester} · {new Set(selectedTimetables[0]?.entries.map(e => e.courseName)).size}과목
                    </p>
                  </div>
                )}

                {/* Grid - 절대 위치 기반 (연속 블록) */}
                <div className="min-w-[700px]">
                  {/* 요일 헤더 */}
                  <div className="flex border-b border-slate-100 dark:border-slate-800">
                    <div className="w-14 flex-shrink-0 p-2 text-xs font-medium text-slate-500 dark:text-slate-400 text-right">
                      시간
                    </div>
                    {DAYS.map(day => (
                      <div key={day} className="flex-1 p-2 text-sm font-semibold text-slate-700 dark:text-slate-300 text-center">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* 시간표 바디 */}
                  <div className="flex">
                    {/* 시간 라벨 */}
                    <div className="w-14 flex-shrink-0">
                      {HOURS.map(hour => (
                        <div
                          key={hour}
                          className="text-xs text-slate-400 dark:text-slate-500 text-right pr-2 border-r border-slate-100 dark:border-slate-800"
                          style={{ height: CELL_HEIGHT }}
                        >
                          {String(hour).padStart(2, '0')}:00
                        </div>
                      ))}
                    </div>

                    {/* 그리드 영역 */}
                    <div className="flex-1 relative" style={{ height: HOURS.length * CELL_HEIGHT }}>
                      {/* 격자선 */}
                      {HOURS.map((_, i) => (
                        <div
                          key={i}
                          className="absolute left-0 right-0 border-b border-slate-50 dark:border-slate-800/50"
                          style={{ top: i * CELL_HEIGHT, height: CELL_HEIGHT }}
                        >
                          <div className="flex h-full">
                            {DAYS.map((_, d) => (
                              <div key={d} className="flex-1 border-r border-slate-50 dark:border-slate-800/50 last:border-r-0" />
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* 공강 하이라이트 */}
                      {isCompareMode && Array.from(freeSlots).map(key => {
                        const [dayStr, minStr] = key.split('-')
                        const day = parseInt(dayStr)
                        const min = parseInt(minStr)
                        const top = (min - GRID_START * 60) * (CELL_HEIGHT / 60)
                        return (
                          <div
                            key={key}
                            className="absolute bg-green-100/60 dark:bg-green-900/20"
                            style={{
                              top,
                              height: 30 * (CELL_HEIGHT / 60),
                              left: `${(day / 6) * 100}%`,
                              width: `${100 / 6}%`,
                            }}
                          />
                        )
                      })}

                      {/* 과목 블록 - 하나의 연속 블록 */}
                      {selectedTimetables.flatMap(t =>
                        t.entries.map(e => {
                          const startMin = timeToMinutes(e.startTime)
                          const endMin = timeToMinutes(e.endTime)
                          const top = (startMin - GRID_START * 60) * (CELL_HEIGHT / 60)
                          const height = (endMin - startMin) * (CELL_HEIGHT / 60)
                          const colors = courseColorMap.get(e.courseName) || COURSE_COLORS[0]

                          return (
                            <div
                              key={`${t.userId}-${e.id}`}
                              className={`absolute ${colors.bg} ${colors.border} border rounded-lg px-2 py-1 overflow-hidden z-10`}
                              style={{
                                top: top + 1,
                                height: height - 2,
                                left: `calc(${(e.dayOfWeek / 6) * 100}% + 2px)`,
                                width: `calc(${100 / 6}% - 4px)`,
                              }}
                              title={`${e.courseName}${e.professor ? ` · ${e.professor}` : ''}${e.room ? ` · ${e.room}` : ''}${isCompareMode ? ` (${t.user.name})` : ''}`}
                            >
                              <div className={`text-xs font-semibold ${colors.text} leading-tight truncate`}>
                                {e.courseName}
                              </div>
                              {height >= 40 && (
                                <div className={`text-[10px] ${colors.text} opacity-70 truncate mt-0.5`}>
                                  {e.professor || ''}
                                </div>
                              )}
                              {height >= 55 && (
                                <div className={`text-[10px] ${colors.text} opacity-60 truncate`}>
                                  {e.room || ''}{isCompareMode ? ` · ${t.user.name}` : ''}
                                </div>
                              )}
                              {height >= 80 && (
                                <div className={`text-[10px] ${colors.text} opacity-50 mt-1`}>
                                  {e.startTime}~{e.endTime}
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* 범례 (단일 모드) */}
                {isSingleMode && selectedTimetables[0] && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[...new Set(selectedTimetables[0].entries.map(e => e.courseName))].map(name => {
                      const colors = courseColorMap.get(name) || COURSE_COLORS[0]
                      const entry = selectedTimetables[0].entries.find(e => e.courseName === name)
                      return (
                        <div key={name} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                          {name}
                          {entry?.professor && <span className="opacity-70">· {entry.professor}</span>}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 공강 비교 범례 */}
                {isCompareMode && (
                  <div className="mt-4 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded border border-green-200 dark:border-green-800" />
                      공통 빈 시간 (09:00~18:00)
                    </div>
                    <span>·</span>
                    <span>{selectedMembers.length}명 모두 빈 시간만 표시</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
