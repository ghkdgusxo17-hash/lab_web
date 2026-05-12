import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAlumni, getAlumniVisibility, isCurrentUserAdmin } from '@/actions/member'
import { Navbar } from '@/components/layout'
import { Mail, GraduationCap, Edit, ArrowLeft, Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '졸업생 | CPE Lab',
    description: '화학공정연구실 졸업생을 소개합니다.',
}

const DEGREE_LABELS: Record<string, string> = {
    MS: '석사',
    PhD: '박사',
}

export default async function AlumniPage() {
    const [alumni, showAlumni, isAdmin] = await Promise.all([
        getAlumni(),
        getAlumniVisibility(),
        isCurrentUserAdmin(),
    ])

    // If alumni section is not visible to this user, redirect to members page
    if (!showAlumni) {
        redirect('/members')
    }

    // Group alumni by graduation year
    const alumniByYear = alumni.reduce((acc, alum) => {
        const year = alum.graduatedAt ? new Date(alum.graduatedAt).getFullYear().toString() : '기타'
        if (!acc[year]) acc[year] = []
        acc[year].push(alum)
        return acc
    }, {} as Record<string, typeof alumni>)

    // Sort years in descending order
    const sortedYears = Object.keys(alumniByYear).sort((a, b) => {
        if (a === '기타') return 1
        if (b === '기타') return -1
        return parseInt(b) - parseInt(a)
    })

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <Link
                            href="/members"
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            구성원으로 돌아가기
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                            <span className="text-gradient">졸업생</span>
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
                            화학공정연구실을 거쳐간 연구자들입니다
                        </p>
                    </div>

                    {/* Alumni by Year */}
                    {alumni.length === 0 ? (
                        <div className="text-center py-20">
                            <GraduationCap className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">등록된 졸업생이 없습니다</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {sortedYears.map((year) => (
                                <section key={year}>
                                    <div className="flex items-center gap-4 mb-6 pl-3 border-l-4 border-emerald-500">
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {year}
                                        </h2>
                                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                            {alumniByYear[year].length}명
                                        </span>
                                    </div>

                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {alumniByYear[year].map((alum) => (
                                            <AlumniCard
                                                key={alum.id}
                                                alumni={alum}
                                                isAdmin={isAdmin}
                                            />
                                        ))}
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

interface AlumniCardProps {
    alumni: {
        id: string
        name: string | null
        email: string | null
        image: string | null
        graduatedAt: Date | null
        currentCompany: string | null
        currentPosition: string | null
        degreeObtained: string | null
    }
    isAdmin: boolean
}

function AlumniCard({ alumni, isAdmin }: AlumniCardProps) {
    return (
        <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            {isAdmin && (
                <Link
                    href={`/admin/users/${alumni.id}`}
                    className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    title="정보 수정"
                >
                    <Edit className="w-4 h-4" />
                </Link>
            )}

            <div className="flex items-start gap-4">
                {alumni.image ? (
                    <img
                        src={alumni.image}
                        alt={alumni.name || ''}
                        className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                    />
                ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center text-xl font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        {alumni.name?.slice(0, 1) || '?'}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate">
                            {alumni.name || '이름 없음'}
                        </h3>
                        {alumni.degreeObtained && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                                {DEGREE_LABELS[alumni.degreeObtained] || alumni.degreeObtained}
                            </span>
                        )}
                    </div>

                    {(alumni.currentCompany || alumni.currentPosition) && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 mb-2">
                            <Building2 className="w-4 h-4 flex-shrink-0 text-slate-400" />
                            <span className="truncate">
                                {alumni.currentCompany}
                                {alumni.currentCompany && alumni.currentPosition && ' · '}
                                {alumni.currentPosition}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                        {alumni.graduatedAt && (
                            <span className="flex items-center gap-1">
                                <GraduationCap className="w-3.5 h-3.5" />
                                {new Date(alumni.graduatedAt).getFullYear()}년 졸업
                            </span>
                        )}
                        {alumni.email && (
                            <a
                                href={`mailto:${alumni.email}`}
                                className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                <Mail className="w-3.5 h-3.5" />
                                연락
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
