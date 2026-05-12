import { Metadata } from 'next'
import Link from 'next/link'
import { getPublications, getPublicationStats } from '@/actions/publication'
import { Navbar } from '@/components/layout'
import { BookOpen, FileText, Award, ExternalLink, Star } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '학술 논문 | CPE Lab',
    description: '화학공정연구실의 연구 성과',
}

const PUBLICATION_TYPES = [
    { key: 'ALL', label: '전체', icon: BookOpen },
    { key: 'JOURNAL', label: '저널 논문', icon: FileText },
    { key: 'CONFERENCE', label: '학술대회', icon: BookOpen },
]

function getTypeInfo(type: string) {
    switch (type) {
        case 'JOURNAL':
            return { label: '저널', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
        case 'CONFERENCE':
            return { label: '학술대회', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' }
        default:
            return { label: '기타', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' }
    }
}

interface PublicationsPageProps {
    searchParams: Promise<{ type?: string }>
}

export default async function PublicationsPage({ searchParams }: PublicationsPageProps) {
    const { type } = await searchParams
    const currentType = type || 'ALL'
    const publications = await getPublications(currentType)
    const stats = await getPublicationStats()

    // Group publications by year
    const groupedByYear = publications.reduce((acc: Record<number, typeof publications>, pub) => {
        if (!acc[pub.year]) {
            acc[pub.year] = []
        }
        acc[pub.year].push(pub)
        return acc
    }, {})

    const years = Object.keys(groupedByYear).map(Number).sort((a, b) => b - a)

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                            학술 <span className="text-gradient">논문</span>
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-300">
                            CPE Lab의 연구 성과를 소개합니다
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap justify-center gap-2 mb-10">
                        {PUBLICATION_TYPES.map((t) => {
                            const Icon = t.icon
                            const isActive = currentType === t.key
                            return (
                                <Link
                                    key={t.key}
                                    href={t.key === 'ALL' ? '/publications' : `/publications?type=${t.key}`}
                                    className={`inline-flex items-center gap-2 px-4 py-2 t-rounded-full text-sm font-medium transition-all ${isActive
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {t.label}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Publications List */}
                    {publications.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 t-rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center">
                            <BookOpen className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">등록된 논문이 없습니다</h3>
                            <p className="text-slate-500">관리자가 논문을 등록하면 여기에 표시됩니다</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {years.map((year) => (
                                <section key={year}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{year}</h2>
                                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                        <span className="text-sm text-slate-500">{groupedByYear[year].length}편</span>
                                    </div>

                                    <div className="space-y-4">
                                        {groupedByYear[year].map((pub) => {
                                            const typeInfo = getTypeInfo(pub.type)
                                            return (
                                                <div
                                                    key={pub.id}
                                                    className="group bg-white dark:bg-slate-900 t-rounded-xl p-6 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className={`px-2 py-0.5 text-xs font-bold t-rounded-sm ${typeInfo.color}`}>
                                                                    {typeInfo.label}
                                                                </span>
                                                                {pub.isHighlight && (
                                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold t-rounded-sm">
                                                                        <Star className="w-3 h-3" />
                                                                        주요 성과
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                {pub.title}
                                                            </h3>
                                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                                {pub.authors}
                                                            </p>
                                                            <p className="text-sm text-slate-500 dark:text-slate-500">
                                                                {pub.journal}
                                                                {pub.volume && `, ${pub.volume}`}
                                                                {pub.pages && `, pp. ${pub.pages}`}
                                                            </p>
                                                        </div>
                                                        {(pub.doi || pub.link) && (
                                                            <a
                                                                href={pub.doi ? `https://doi.org/${pub.doi}` : pub.link || '#'}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex-shrink-0 p-2 t-rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                            >
                                                                <ExternalLink className="w-5 h-5" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}
