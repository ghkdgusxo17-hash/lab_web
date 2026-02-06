import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { getMyProfile } from '@/actions/profile'
import { Navbar } from '@/components/layout'
import { ProfileForm } from './ProfileForm'
import { ThemeToggle } from './ThemeToggle'
import { MedalBadge } from '@/components/ui/MedalBadge'
import { User } from 'lucide-react'

export const metadata: Metadata = {
    title: '설정 | CPE Lab',
}

export default async function SettingsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    const profile = await getMyProfile()

    if (!profile) {
        redirect('/login')
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-2xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            설정
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            프로필과 화면 설정을 관리하세요
                        </p>
                    </div>

                    {/* My Profile Button */}
                    <Link
                        href={`/members/${session.user.id}`}
                        className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">내 프로필</span>
                                <MedalBadge medalPoints={(session.user as any).medalPoints || 0} size="sm" />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                활동 통계, 발표 이력, 훈장 현황 보기
                            </p>
                        </div>
                        <span className="text-slate-400 group-hover:text-blue-500 transition-colors text-lg">&rarr;</span>
                    </Link>

                    {/* Theme Settings */}
                    <ThemeToggle />

                    {/* Profile Settings */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                            프로필 설정
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                            프로필 정보를 수정하세요. 구성원 페이지에 표시됩니다.
                        </p>
                        <ProfileForm profile={profile} />
                    </div>
                </div>
            </main>
        </>
    )
}
