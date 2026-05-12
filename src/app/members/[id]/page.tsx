import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout'
import { getMemberProfile } from '@/actions/member'
import { MedalBadge } from '@/components/ui/MedalBadge'
import { getMedalTier } from '@/lib/medal'
import { ArrowLeft, Trophy, FileText, CheckCircle, BarChart3, Presentation, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, string> = {
    PROFESSOR: '교수',
    PHD: '박사과정',
    MS: '석사과정',
    BS: '학부생',
    ALUMNI: '졸업생',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const profile = await getMemberProfile(id)
    return {
        title: profile ? `${profile.name} | CPE Lab` : '멤버 프로필 | CPE Lab',
    }
}

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const profile = await getMemberProfile(id)

    if (!profile) {
        notFound()
    }

    const tier = getMedalTier(profile.medalPoints)

    // 프로그레스 바 계산
    const tierThresholds = [0, 1, 4, 7, 10]
    const currentTierLevel = tier?.level || 0
    const currentThreshold = tierThresholds[currentTierLevel] || 0
    const nextThreshold = tierThresholds[Math.min(currentTierLevel + 1, 4)] || 10
    const progressPercent = currentTierLevel >= 4
        ? 100
        : Math.round(((profile.medalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100)

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Back */}
                    <Link
                        href="/members"
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        구성원 목록
                    </Link>

                    {/* Profile Header */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 mb-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            {profile.image ? (
                                <img
                                    src={profile.image}
                                    alt={profile.name || ''}
                                    className="w-28 h-28 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800"
                                />
                            ) : (
                                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center text-4xl font-bold text-blue-600 dark:text-blue-400 border-4 border-slate-100 dark:border-slate-800">
                                    {profile.name?.slice(0, 1) || '?'}
                                </div>
                            )}

                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {profile.name || '이름 없음'}
                                    </h1>
                                    <MedalBadge medalPoints={profile.medalPoints} size="lg" />
                                </div>

                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">
                                    {ROLE_LABELS[profile.role] || profile.role}
                                </p>

                                {profile.bio && (
                                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                                        {profile.bio}
                                    </p>
                                )}

                                {profile.researchInterests && (
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
                                        {(() => {
                                            let interests: string[] = []
                                            try {
                                                const parsed = JSON.parse(profile.researchInterests)
                                                interests = Array.isArray(parsed) ? parsed : []
                                            } catch {
                                                interests = profile.researchInterests.split(',').map((s: string) => s.trim()).filter(Boolean)
                                            }
                                            return interests.map((interest: string) => (
                                                <span
                                                    key={interest}
                                                    className="px-2.5 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg"
                                                >
                                                    {interest}
                                                </span>
                                            ))
                                        })()}
                                    </div>
                                )}

                                {/* Medal Progress */}
                                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {tier ? `${tier.emoji || ''} ${tier.name}` : '훈장 없음'}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {profile.medalPoints}점
                                            {profile.nextTierInfo && (
                                                <> / 다음 등급까지 {profile.nextTierInfo.pointsNeeded}점</>
                                            )}
                                        </span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                currentTierLevel >= 4
                                                    ? 'bg-gradient-to-r from-amber-400 via-rose-400 to-purple-500'
                                                    : currentTierLevel >= 3
                                                        ? 'bg-amber-400'
                                                        : currentTierLevel >= 2
                                                            ? 'bg-slate-400'
                                                            : currentTierLevel >= 1
                                                                ? 'bg-amber-600'
                                                                : 'bg-slate-300'
                                            }`}
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                    {profile.nextTierInfo && (
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                                            {profile.nextTierInfo.name}까지 MVP {profile.nextTierInfo.pointsNeeded}회 남음
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <StatCard
                            icon={<Presentation className="w-5 h-5 text-blue-500" />}
                            label="발표"
                            value={profile.stats.presentationCount}
                            unit="회"
                        />
                        <StatCard
                            icon={<Trophy className="w-5 h-5 text-amber-500" />}
                            label="MVP"
                            value={profile.stats.mvpCount}
                            unit="회"
                        />
                        <StatCard
                            icon={<FileText className="w-5 h-5 text-green-500" />}
                            label="게시글"
                            value={profile.stats.postCount}
                            unit="개"
                        />
                        <StatCard
                            icon={<CheckCircle className="w-5 h-5 text-purple-500" />}
                            label="작업 완료"
                            value={profile.stats.totalTasks > 0
                                ? Math.round((profile.stats.completedTasks / profile.stats.totalTasks) * 100)
                                : 0}
                            unit="%"
                            sub={`${profile.stats.completedTasks}/${profile.stats.totalTasks}`}
                        />
                    </div>

                    {/* Lab Meeting Presentations */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            랩미팅 발표 이력
                        </h2>

                        {profile.presentations.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                                아직 발표 이력이 없습니다
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {profile.presentations.map((pres) => {
                                    const hasMvp = pres.labMeeting?.medalAwards && pres.labMeeting.medalAwards.length > 0
                                    return (
                                        <Link
                                            key={pres.id}
                                            href={`/materials/lab-meeting/${pres.labMeeting?.id}`}
                                            className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                <Presentation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-medium text-slate-900 dark:text-white text-sm truncate">
                                                        {pres.title}
                                                    </span>
                                                    {hasMvp && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex-shrink-0">
                                                            <Trophy className="w-3 h-3" /> MVP
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                    <Calendar className="w-3 h-3" />
                                                    {pres.labMeeting?.date ? formatDate(pres.labMeeting.date) : ''}
                                                    <span className="text-slate-300 dark:text-slate-600">|</span>
                                                    {pres.labMeeting?.title}
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    )
}

function StatCard({ icon, label, value, unit, sub }: {
    icon: React.ReactNode
    label: string
    value: number
    unit: string
    sub?: string
}) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
            <div className="flex justify-center mb-2">{icon}</div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {value}<span className="text-sm font-normal text-slate-500">{unit}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
    )
}
