'use client'

import { useState } from 'react'
import { Mail, MailOpen, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { markInquiryAsRead, deleteInquiry } from '@/actions/contact'

interface Inquiry {
    id: string
    name: string
    email: string
    subject: string
    message: string
    isRead: boolean
    createdAt: Date
}

interface InquiryManagerProps {
    inquiries: Inquiry[]
}

export function InquiryManager({ inquiries }: InquiryManagerProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    async function handleMarkAsRead(id: string) {
        await markInquiryAsRead(id)
    }

    async function handleDelete(id: string) {
        if (!confirm('이 문의를 삭제하시겠습니까?')) return
        await deleteInquiry(id)
    }

    function formatDate(date: Date) {
        return new Date(date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const unreadCount = inquiries.filter(i => !i.isRead).length

    return (
        <div className="mb-10">
            <div className="flex items-center gap-3 mb-4 pl-3 border-l-4 border-blue-500">
                <Mail className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    문의 내역
                </h2>
                {unreadCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-sm font-bold text-red-600 dark:text-red-400">
                        {unreadCount} 새 문의
                    </span>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-blue-100 dark:border-blue-900/30 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                {inquiries.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                        문의 내역이 없습니다
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {inquiries.map((inquiry) => {
                            const isExpanded = expandedId === inquiry.id

                            return (
                                <div key={inquiry.id} className={inquiry.isRead ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}>
                                    <button
                                        onClick={() => {
                                            setExpandedId(isExpanded ? null : inquiry.id)
                                            if (!inquiry.isRead) {
                                                handleMarkAsRead(inquiry.id)
                                            }
                                        }}
                                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            {inquiry.isRead ? (
                                                <MailOpen className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                            ) : (
                                                <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className={`font-medium truncate ${inquiry.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                                    {inquiry.subject}
                                                </p>
                                                <p className="text-sm text-slate-500 truncate">
                                                    {inquiry.name} ({inquiry.email})
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatDate(inquiry.createdAt)}
                                            </span>
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-6 pb-4 bg-slate-50 dark:bg-slate-800/30">
                                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">
                                                            {inquiry.name}
                                                        </p>
                                                        <a href={`mailto:${inquiry.email}`} className="text-sm text-blue-600 hover:underline">
                                                            {inquiry.email}
                                                        </a>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete(inquiry.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                                                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                                                        {inquiry.message}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
