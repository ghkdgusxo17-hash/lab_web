'use client'

import { useState, useTransition } from 'react'
import { Session } from 'next-auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Plus, X, Save, Trash2 } from 'lucide-react'
import { saveTimetable, parseTimetablePdfAction } from '@/actions/timetable'

const DAYS = ['월', '화', '수', '목', '금', '토']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8)
const CELL_HEIGHT = 60
const GRID_START = 8

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

interface Entry {
  dayOfWeek: number
  startTime: string
  endTime: string
  courseName: string
  professor: string | null
  room: string | null
  color: string | null
}

interface TimetableEditorClientProps {
  session: Session
  existingEntries: Entry[]
  semester: string
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function TimetableEditorClient({ existingEntries, semester }: TimetableEditorClientProps) {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>(existingEntries)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 수동 입력 모달
  const [showModal, setShowModal] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '10:00',
    courseName: '',
    professor: '',
    room: '',
  })

  // 과목별 색상 매핑
  const courseColorMap = new Map<string, typeof COURSE_COLORS[0]>()
  let colorIdx = 0
  for (const e of entries) {
    if (!courseColorMap.has(e.courseName)) {
      courseColorMap.set(e.courseName, COURSE_COLORS[colorIdx % COURSE_COLORS.length])
      colorIdx++
    }
  }

  // PDF 파일 처리 (공통)
  const [isDragging, setIsDragging] = useState(false)

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('PDF 파일만 업로드 가능합니다.')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await parseTimetablePdfAction(formData)

      if (result.courses.length === 0) {
        setError('PDF에서 과목을 찾을 수 없습니다. 수동으로 입력해주세요.')
        return
      }

      setEntries(result.courses.map(c => ({
        dayOfWeek: c.dayOfWeek,
        startTime: c.startTime,
        endTime: c.endTime,
        courseName: c.courseName,
        professor: c.professor,
        room: c.room,
        color: null,
      })))

      const uniqueCount = new Set(result.courses.map(c => c.courseName)).size
      setSuccess(`PDF에서 ${uniqueCount}과목을 추출했습니다. 확인 후 저장해주세요.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF 파싱에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  // 파일 선택
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
    e.target.value = ''
  }

  // 드래그 앤 드롭
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  // 수동 입력 모달 열기
  const openAddModal = (dayOfWeek?: number, hour?: number) => {
    setEditIndex(null)
    setFormData({
      dayOfWeek: dayOfWeek ?? 0,
      startTime: hour ? `${String(hour).padStart(2, '0')}:00` : '09:00',
      endTime: hour ? `${String(hour + 1).padStart(2, '0')}:00` : '10:00',
      courseName: '',
      professor: '',
      room: '',
    })
    setShowModal(true)
  }

  const openEditModal = (index: number) => {
    const entry = entries[index]
    setEditIndex(index)
    setFormData({
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      courseName: entry.courseName,
      professor: entry.professor || '',
      room: entry.room || '',
    })
    setShowModal(true)
  }

  const handleSaveEntry = () => {
    if (!formData.courseName.trim()) return

    const newEntry: Entry = {
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      courseName: formData.courseName.trim(),
      professor: formData.professor.trim() || null,
      room: formData.room.trim() || null,
      color: null,
    }

    if (editIndex !== null) {
      setEntries(prev => prev.map((e, i) => i === editIndex ? newEntry : e))
    } else {
      setEntries(prev => [...prev, newEntry])
    }
    setShowModal(false)
  }

  const handleDeleteEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index))
  }

  // 저장
  const handleSave = () => {
    if (entries.length === 0) {
      setError('저장할 수업이 없습니다.')
      return
    }

    setError(null)
    setSuccess(null)

    startTransition(async () => {
      try {
        await saveTimetable(entries)
        setSuccess('시간표가 저장되었습니다!')
        setTimeout(() => router.push('/timetable'), 1000)
      } catch (err) {
        setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
      }
    })
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <Link href="/timetable" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            시간표
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
            시간표 편집
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">
            {semester ? `${semester} 학기` : '현재 학기'} · PDF 업로드 또는 수동 입력
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openAddModal()}
            className="inline-flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            수동 추가
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || entries.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* 알림 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800">
          {success}
        </div>
      )}

      {/* PDF 업로드 */}
      <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">PDF 업로드</h3>
        <label
          className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]'
              : isUploading
              ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10'
              : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 pointer-events-none">
            <Upload className="w-5 h-5" />
            <span className="text-sm font-medium">
              {isUploading ? 'PDF 파싱 중...' : isDragging ? 'PDF를 여기에 놓으세요' : '학교 시간표 PDF를 드래그하거나 클릭하여 업로드'}
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 pointer-events-none">
            업로드하면 기존 수업이 교체됩니다
          </p>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handlePdfUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* 시간표 그리드 (편집 모드) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {entries.length > 0 ? `${new Set(entries.map(e => e.courseName)).size}과목` : '수업 없음'}
          </h3>
          {entries.length > 0 && (
            <button
              onClick={() => { if (confirm('모든 수업을 삭제하시겠습니까?')) setEntries([]) }}
              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              전체 삭제
            </button>
          )}
        </div>

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
              {/* 격자선 (클릭 가능) */}
              {HOURS.map((hour, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-b border-slate-50 dark:border-slate-800/50"
                  style={{ top: i * CELL_HEIGHT, height: CELL_HEIGHT }}
                >
                  <div className="flex h-full">
                    {DAYS.map((_, d) => (
                      <div
                        key={d}
                        className="flex-1 border-r border-slate-50 dark:border-slate-800/50 last:border-r-0 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        onClick={() => openAddModal(d, hour)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* 과목 블록 - 연속 블록 */}
              {entries.map((entry, index) => {
                const startMin = timeToMinutes(entry.startTime)
                const endMin = timeToMinutes(entry.endTime)
                const top = (startMin - GRID_START * 60) * (CELL_HEIGHT / 60)
                const height = (endMin - startMin) * (CELL_HEIGHT / 60)
                const colors = courseColorMap.get(entry.courseName) || COURSE_COLORS[0]

                return (
                  <div
                    key={index}
                    className={`absolute ${colors.bg} ${colors.border} border rounded-lg px-2 py-1 overflow-hidden z-10 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all`}
                    style={{
                      top: top + 1,
                      height: height - 2,
                      left: `calc(${(entry.dayOfWeek / 6) * 100}% + 2px)`,
                      width: `calc(${100 / 6}% - 4px)`,
                    }}
                    onClick={(ev) => {
                      ev.stopPropagation()
                      openEditModal(index)
                    }}
                    title="클릭하여 수정"
                  >
                    <div className={`text-xs font-semibold ${colors.text} leading-tight truncate`}>
                      {entry.courseName}
                    </div>
                    {height >= 40 && (
                      <div className={`text-[10px] ${colors.text} opacity-70 truncate mt-0.5`}>
                        {entry.professor || ''}
                      </div>
                    )}
                    {height >= 55 && (
                      <div className={`text-[10px] ${colors.text} opacity-60 truncate`}>
                        {entry.room || ''}
                      </div>
                    )}
                    {height >= 80 && (
                      <div className={`text-[10px] ${colors.text} opacity-50 mt-1`}>
                        {entry.startTime}~{entry.endTime}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 수업 목록 */}
        {entries.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">수업 목록</h4>
            {entries
              .sort((a, b) => a.dayOfWeek !== b.dayOfWeek ? a.dayOfWeek - b.dayOfWeek : a.startTime.localeCompare(b.startTime))
              .map((entry, i) => {
                const colors = courseColorMap.get(entry.courseName) || COURSE_COLORS[0]
                return (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className={`w-2 h-8 rounded-full ${colors.bg.replace('/40', '')}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {DAYS[entry.dayOfWeek]} {entry.startTime}~{entry.endTime} · {entry.courseName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {entry.professor || '-'} · {entry.room || '-'}
                      </div>
                    </div>
                    <button
                      onClick={() => openEditModal(entries.indexOf(entry))}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Plus className="w-4 h-4 rotate-45" />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entries.indexOf(entry))}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* 수동 입력 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editIndex !== null ? '수업 수정' : '수업 추가'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">과목명 *</label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={e => setFormData(prev => ({ ...prev, courseName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="고분자특론"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">교수명</label>
                  <input
                    type="text"
                    value={formData.professor}
                    onChange={e => setFormData(prev => ({ ...prev, professor: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="김경민"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">강의실</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={e => setFormData(prev => ({ ...prev, room: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="N12-424"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">요일</label>
                <div className="flex gap-1">
                  {DAYS.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => setFormData(prev => ({ ...prev, dayOfWeek: idx }))}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                        formData.dayOfWeek === idx
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">시작 시간</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">종료 시간</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              {editIndex !== null && (
                <button
                  onClick={() => { handleDeleteEntry(editIndex); setShowModal(false) }}
                  className="px-4 py-2 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mr-auto"
                >
                  삭제
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveEntry}
                disabled={!formData.courseName.trim()}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editIndex !== null ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
