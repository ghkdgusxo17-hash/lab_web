'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Users, X } from 'lucide-react'
import { updateLabMeeting } from '@/actions/lab-meeting'

interface Member {
    id: string
    name: string | null
    image: string | null
    role: string
}

interface Meeting {
    id: string
    date: Date
    title: string
    description: string | null
    presenters: {
        id: string
        name: string | null
        image: string | null
    }[]
}

interface Props {
    meeting: Meeting
    members: Member[]
}

export function EditLabMeetingForm({ meeting, members }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState(new Date(meeting.date).toISOString().split('T')[0])
    const [title, setTitle] = useState(meeting.title)
    const [description, setDescription] = useState(meeting.description || '')
    const [selectedPresenters, setSelectedPresenters] = useState<string[]>(
        meeting.presenters.map(p => p.id)
    )

    function togglePresenter(memberId: string) {
        setSelectedPresenters(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        )
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!date || !title) {
            alert('날짜와 제목을 입력해주세요.')
            return
        }

        setLoading(true)

        const formData = new FormData()
        formData.set('date', date)
        formData.set('title', title)
        formData.set('description', description)
        selectedPresenters.forEach(id => formData.append('presenterIds', id))

        const result = await updateLabMeeting(meeting.id, formData)

        if (result.error) {
            alert(result.error)
            setLoading(false)
        } else {
            router.push(`/materials/lab-meeting/${meeting.id}`)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    날짜 *
                </label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
            </div>

            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    제목 *
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="예: 주간 랩미팅, 논문 세미나"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    설명 (선택)
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="랩미팅에 대한 간단한 설명"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
            </div>

            {/* Presenters */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    발표자 (선택)
                </label>
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    {members.map((member) => (
                        <button
                            key={member.id}
                            type="button"
                            onClick={() => togglePresenter(member.id)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                selectedPresenters.includes(member.id)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-blue-300'
                            }`}
                        >
                            {member.image ? (
                                <img
                                    src={member.image}
                                    alt={member.name || ''}
                                    className="w-5 h-5 rounded-full"
                                />
                            ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600" />
                            )}
                            {member.name || '이름 없음'}
                            {selectedPresenters.includes(member.id) && (
                                <X className="w-3 h-3" />
                            )}
                        </button>
                    ))}
                </div>
                {selectedPresenters.length > 0 && (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        {selectedPresenters.length}명 선택됨
                    </p>
                )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 py-3 px-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                    취소
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {loading ? '저장 중...' : '저장'}
                </button>
            </div>
        </form>
    )
}
