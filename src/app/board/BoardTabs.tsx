'use client'

import Link from 'next/link'
import { Megaphone, MessageSquare, BookOpen } from 'lucide-react'

export function BoardTabs({ currentType }: { currentType?: string }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
            <nav className="space-y-1">
                <Link
                    href="/board"
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${!currentType
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                >
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    전체 게시글
                </Link>
                <Link
                    href="/board?type=NOTICE"
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${currentType === 'NOTICE'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                >
                    <Megaphone className="w-4 h-4" />
                    공지사항
                </Link>
                <Link
                    href="/board?type=SEMINAR"
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${currentType === 'SEMINAR'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                >
                    <BookOpen className="w-4 h-4" />
                    세미나
                </Link>
                <Link
                    href="/board?type=FREE"
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${currentType === 'FREE'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                >
                    <MessageSquare className="w-4 h-4" />
                    자유게시판
                </Link>
            </nav>
        </div>
    )
}

