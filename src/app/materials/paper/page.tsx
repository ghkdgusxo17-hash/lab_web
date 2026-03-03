import { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout'
import { FileText, ArrowLeft, RotateCcw, BookOpen } from 'lucide-react'

export const metadata: Metadata = {
    title: '논문 | CPE Lab',
    description: '논문 관리',
}

const SUB_CATEGORIES = [
    {
        href: '/materials/paper/lab',
        icon: FileText,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-50 dark:bg-blue-900/20',
        label: 'Lab Papers',
        description: '우리 랩에서 작성한 논문을 관리합니다',
        linkColor: 'text-blue-600',
    },
    {
        href: '/materials/paper/revisions',
        icon: RotateCcw,
        iconColor: 'text-orange-600',
        iconBg: 'bg-orange-50 dark:bg-orange-900/20',
        label: 'Revisions',
        description: '논문의 리비전 파일을 관리합니다',
        linkColor: 'text-orange-600',
    },
    {
        href: '/materials/paper/reading',
        icon: BookOpen,
        iconColor: 'text-green-600',
        iconBg: 'bg-green-50 dark:bg-green-900/20',
        label: 'Paper Reading',
        description: '읽은 논문과 발표자료를 정리합니다',
        linkColor: 'text-green-600',
    },
]

export default function PaperPage() {
    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-12">
                        <Link
                            href="/materials"
                            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            연구자료
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                                논문
                            </h1>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                        {SUB_CATEGORIES.map((cat) => {
                            const Icon = cat.icon
                            return (
                                <Link
                                    key={cat.href}
                                    href={cat.href}
                                    className="group bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className={`w-12 h-12 rounded-2xl ${cat.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon className={`w-6 h-6 ${cat.iconColor}`} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                        {cat.label}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                        {cat.description}
                                    </p>
                                    <div className={`text-xs font-medium ${cat.linkColor} group-hover:underline`}>
                                        바로가기 →
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </main>
        </>
    )
}
