import { Metadata } from 'next'
import Link from 'next/link'
import { getMembers, getAlumni, isCurrentUserAdmin, getAlumniVisibility } from '@/actions/member'
import { Navbar } from '@/components/layout'
import { GraduationCap, User, ArrowRight } from 'lucide-react'
import { MemberCard } from './MemberCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '구성원 | CPE Lab',
    description: '화학공정연구실 구성원을 소개합니다.',
}

const ROLE_ORDER = ['PROFESSOR', 'PHD', 'MS', 'BS']
const ROLE_LABELS: Record<string, string> = {
    PROFESSOR: '교수',
    PHD: '박사과정',
    MS: '석사과정',
    BS: '학부생',
}

export default async function MembersPage() {
    const [members, alumni, isAdmin, showAlumni] = await Promise.all([
        getMembers(),
        getAlumni(),
        isCurrentUserAdmin(),
        getAlumniVisibility(),
    ])

    const groupedMembers = ROLE_ORDER.map((role) => ({
        role,
        label: ROLE_LABELS[role],
        members: members.filter((user) => user.role === role),
    })).filter((group) => group.members.length > 0)

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-20 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                            연구실 <span className="text-gradient">구성원</span>
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                            화학공정의 혁신을 이끄는 열정적인 연구자들입니다
                        </p>
                    </div>

                    {/* Current Members */}
                    {groupedMembers.length === 0 ? (
                        <div className="text-center py-20">
                            <User className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">등록된 구성원이 없습니다</p>
                        </div>
                    ) : (
                        groupedMembers.map((group) => (
                            <section key={group.role} className="mb-16">
                                <div className="flex items-center gap-4 mb-8 pl-2 border-l-4 border-blue-500">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {group.label}
                                    </h2>
                                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        {group.members.length}
                                    </span>
                                </div>

                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {group.members.map((member) => (
                                        <MemberCard
                                            key={member.id}
                                            member={member}
                                            isAdmin={isAdmin}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))
                    )}

                    {/* Alumni Link Button */}
                    {showAlumni && alumni.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                            <Link
                                href="/members/alumni"
                                className="group flex items-center justify-between p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                                        <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            졸업생
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {alumni.length}명의 졸업생이 있습니다
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}

