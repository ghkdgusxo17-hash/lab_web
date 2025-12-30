import { Metadata } from 'next'
import Link from 'next/link'
import { getMembers, isCurrentUserAdmin } from '@/actions/member'
import { Navbar } from '@/components/layout'
import { Mail, GraduationCap, Edit, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '구성원 | CPE Lab',
    description: '화학공정연구실 구성원을 소개합니다.',
}

const ROLE_ORDER = ['PROFESSOR', 'PHD', 'MS', 'BS', 'ALUMNI']
const ROLE_LABELS: Record<string, string> = {
    PROFESSOR: '교수',
    PHD: '박사과정',
    MS: '석사과정',
    BS: '학부생',
    ALUMNI: '졸업생',
}

export default async function MembersPage() {
    const members = await getMembers()
    const isAdmin = await isCurrentUserAdmin()

    const groupedMembers = ROLE_ORDER.map((role) => ({
        role,
        label: ROLE_LABELS[role],
        members: members.filter((user) => user.role === role),
    })).filter((group) => group.members.length > 0)

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-20 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                            연구실 <span className="text-gradient">구성원</span>
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                            화학공정의 혁신을 이끄는 열정적인 연구자들입니다
                        </p>
                    </div>

                    {/* Member Groups */}
                    {groupedMembers.length === 0 ? (
                        <div className="text-center py-20">
                            <User className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">등록된 구성원이 없습니다</p>
                        </div>
                    ) : (
                        groupedMembers.map((group) => (
                            <section key={group.role} className="mb-20">
                                <div className="flex items-center gap-4 mb-10 pl-2 border-l-4 border-blue-500">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {group.label}
                                    </h2>

                                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        {group.members.length}
                                    </span>
                                </div>

                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {group.members.map((member) => (
                                        <div
                                            key={member.id}
                                            className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                        >
                                            {/* Admin Edit Button */}
                                            {isAdmin && (
                                                <Link
                                                    href={`/admin/users/${member.id}`}
                                                    className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                    title="정보 수정"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                            )}

                                            <div className="flex flex-col items-center text-center">
                                                {/* Avatar */}
                                                {member.image ? (
                                                    <img
                                                        src={member.image}
                                                        alt={member.name || ''}
                                                        className="w-24 h-24 rounded-full object-cover mb-6 group-hover:scale-110 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center text-3xl font-bold text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                                                        {member.name?.slice(0, 1) || '?'}
                                                    </div>
                                                )}

                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                                    {member.name || '이름 없음'}
                                                </h3>
                                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-4">
                                                    {ROLE_LABELS[member.role] || member.role}
                                                </p>

                                                {member.bio && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 h-10">
                                                        {member.bio}
                                                    </p>
                                                )}

                                                {member.researchInterests && (
                                                    <div className="mb-6">
                                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">연구분야</p>
                                                        <div className="flex flex-wrap justify-center gap-1.5">
                                                            {(() => {
                                                                let interests: string[] = []
                                                                try {
                                                                    const parsed = JSON.parse(member.researchInterests)
                                                                    interests = Array.isArray(parsed) ? parsed : []
                                                                } catch {
                                                                    interests = member.researchInterests.split(',').map((s: string) => s.trim()).filter(Boolean)
                                                                }
                                                                return interests.slice(0, 3).map((interest: string) => (
                                                                    <span
                                                                        key={interest}
                                                                        className="px-2 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md"
                                                                    >
                                                                        {interest}
                                                                    </span>
                                                                ))
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}


                                                <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800">
                                                    <a
                                                        href={`mailto:${member.email}`}
                                                        className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                        <span className="truncate">{member.email}</span>
                                                    </a>
                                                    {member.graduatedAt && (
                                                        <div className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
                                                            <GraduationCap className="w-4 h-4" />
                                                            {new Date(member.graduatedAt).getFullYear()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))
                    )}
                </div>
            </main>
        </>
    )
}
