'use client'

import Link from 'next/link'
import { Mail, Edit } from 'lucide-react'
import { MedalBadge } from '@/components/ui/MedalBadge'
import { UserAvatar } from '@/components/ui/UserAvatar'

const ROLE_LABELS: Record<string, string> = {
    PROFESSOR: '교수',
    PHD: '박사과정',
    MS: '석사과정',
    BS: '학부생',
}

interface MemberCardProps {
    member: {
        id: string
        name: string | null
        email: string | null
        image: string | null
        role: string
        bio: string | null
        researchInterests: string | null
        graduatedAt: Date | null
        medalPoints: number
    }
    isAdmin: boolean
}

export function MemberCard({ member, isAdmin }: MemberCardProps) {
    return (
        <Link href={`/members/${member.id}`} className="group relative block bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            {isAdmin && (
                <span
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/admin/users/${member.id}` }}
                    className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
                    title="정보 수정"
                >
                    <Edit className="w-4 h-4" />
                </span>
            )}

            <div className="flex flex-col items-center text-center">
                <UserAvatar
                    src={member.image}
                    name={member.name}
                    size={96}
                    className="mb-6 group-hover:scale-110 transition-transform duration-300"
                />

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    {member.name || '이름 없음'}
                    {' '}<MedalBadge medalPoints={member.medalPoints} size="md" />
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
                    <span
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `mailto:${member.email}` }}
                        className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{member.email}</span>
                    </span>
                </div>
            </div>
        </Link>
    )
}
