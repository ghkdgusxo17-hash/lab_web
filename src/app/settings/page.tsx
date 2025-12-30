import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getMyProfile } from '@/actions/profile'
import { Navbar } from '@/components/layout'
import { ProfileForm } from './ProfileForm'
import { ThemeToggle } from './ThemeToggle'

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
