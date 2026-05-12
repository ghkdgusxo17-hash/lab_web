'use client'

import { useState } from 'react'
import { Megaphone, Plus, Trash2, Power, PowerOff, X } from 'lucide-react'
import { createAnnouncement, deleteAnnouncement, toggleAnnouncementActive } from '@/actions/announcement'

interface Announcement {
    id: string
    title: string
    content: string
    isActive: boolean
    priority: number
    startDate: Date
    endDate: Date | null
    createdAt: Date
}

interface Member {
    id: string
    name: string | null
    image: string | null
}

interface AnnouncementManagerProps {
    announcements: Announcement[]
    members: Member[]
}

export function AnnouncementManager({ announcements, members }: AnnouncementManagerProps) {
    const [showForm, setShowForm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [priority, setPriority] = useState(0)
    const [endDate, setEndDate] = useState('')

    // Notification State
    const [sendNotification, setSendNotification] = useState(false)
    const [notifyAll, setNotifyAll] = useState(true)
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])

    // Update selected members when notifying all
    const handleNotifyAllChange = (checked: boolean) => {
        setNotifyAll(checked)
        if (checked) {
            setSelectedMembers(members.map(m => m.id))
        } else {
            setSelectedMembers([])
        }
    }

    const toggleMemberSelection = (memberId: string) => {
        if (selectedMembers.includes(memberId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== memberId))
        } else {
            setSelectedMembers([...selectedMembers, memberId])
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData()
        formData.set('title', title)
        formData.set('content', content)
        formData.set('priority', priority.toString())
        if (endDate) formData.set('endDate', endDate)

        if (sendNotification) {
            const recipients = notifyAll ? members.map(m => m.id) : selectedMembers
            formData.set('recipientIds', JSON.stringify(recipients))
        }

        const result = await createAnnouncement(formData)

        if (result.error) {
            alert(result.error)
        } else {
            setTitle('')
            setContent('')
            setPriority(0)
            setEndDate('')
            setSendNotification(false)
            setNotifyAll(true)
            setSelectedMembers([])
            setShowForm(false)
        }
        setLoading(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('정말 삭제하시겠습니까?')) return
        await deleteAnnouncement(id)
    }

    async function handleToggle(id: string) {
        await toggleAnnouncementActive(id)
    }

    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 pl-3 border-l-4 border-blue-500">
                    <Megaphone className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        공지사항 관리
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-sm font-bold text-blue-600 dark:text-blue-400">
                        {announcements.length}
                    </span>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors text-sm"
                >
                    <Plus className="w-4 h-4" />
                    새 공지
                </button>
            </div>

            {/* New Announcement Form */}
            {showForm && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 mb-4 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900 dark:text-white">새 공지 작성</h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">제목</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                placeholder="공지 제목"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">내용</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                                rows={3}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                                placeholder="공지 내용"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">우선순위</label>
                                <input
                                    type="number"
                                    value={priority}
                                    onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">종료일 (선택)</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>


                        {/* Email Notification Section */}
                        <div className="pt-4 border-t border-blue-100 dark:border-blue-800">
                            <div className="flex items-center gap-3 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={sendNotification}
                                        onChange={(e) => setSendNotification(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">이메일 알림 보내기</span>
                                </label>
                            </div>

                            {sendNotification && (
                                <div className="pl-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={notifyAll}
                                                onChange={() => handleNotifyAllChange(true)}
                                                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-slate-600 dark:text-slate-400">전체 멤버 ({members.length}명)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={!notifyAll}
                                                onChange={() => handleNotifyAllChange(false)}
                                                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-slate-600 dark:text-slate-400">직접 선택</span>
                                        </label>
                                    </div>

                                    {!notifyAll && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto custom-scrollbar">
                                            {members.map((member) => (
                                                <label key={member.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-1 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMembers.includes(member.id)}
                                                        onChange={() => toggleMemberSelection(member.id)}
                                                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                                                        {member.name || '이름 없음'}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? '등록 중...' : '공지 등록'}
                        </button>
                    </form>
                </div >
            )
            }

            {/* Announcements List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-blue-100 dark:border-blue-900/30 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                {announcements.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {announcements.map((announcement) => (
                            <div key={announcement.id} className="p-4 flex items-start gap-4">
                                <div className={`w-2 h-2 rounded-full mt-2 ${announcement.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-bold ${announcement.isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                        {announcement.title}
                                    </h4>
                                    <p className={`text-sm mt-0.5 line-clamp-2 ${announcement.isActive ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400'}`}>
                                        {announcement.content}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                        <span>우선순위: {announcement.priority}</span>
                                        {announcement.endDate && (
                                            <>
                                                <span>•</span>
                                                <span>종료: {new Date(announcement.endDate).toLocaleDateString('ko-KR')}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggle(announcement.id)}
                                        className={`p-2 rounded-lg transition-colors ${announcement.isActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                        title={announcement.isActive ? '비활성화' : '활성화'}
                                    >
                                        {announcement.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(announcement.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="삭제"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                        등록된 공지가 없습니다
                    </div>
                )}
            </div>
        </div >
    )
}
