import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout'
import { ChevronLeft, UserPlus, Users, UserCheck, UserX } from 'lucide-react'
import { getAllUsers } from '@/actions/user'
import { AdminUserList } from '@/components/admin/AdminUserList'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '회원 관리 | CPE Lab',
    description: '회원 가입 승인 및 관리',
}

export default async function UsersPage() {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        redirect('/')
    }

    const userResult = await getAllUsers()

    if (userResult.error || !userResult.users) {
        return (
            <>
                <Navbar />
                <main className="min-h-screen pt-32 pb-20 px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center py-12">
                            <p className="text-red-500">{userResult.error || "사용자를 불러올 수 없습니다."}</p>
                        </div>
                    </div>
                </main>
            </>
        )
    }

    const members = userResult.users.filter((u: { isApproved: boolean }) => u.isApproved)
    const pendingUsers = userResult.users.filter((u: { isApproved: boolean }) => !u.isApproved)

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Back Link */}
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 mb-6"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        관리자 설정
                    </Link>

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                회원 관리
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                회원 가입 승인 및 관리
                            </p>
                        </div>
                        <Link
                            href="/admin/users/new"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700"
                        >
                            <UserPlus className="w-4 h-4" />
                            새 구성원 추가
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{members.length}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">활성 멤버</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                                <UserX className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingUsers.length}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">승인 대기</p>
                            </div>
                        </div>
                    </div>

                    {/* Pending Users */}
                    {pendingUsers.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <UserX className="w-5 h-5 text-slate-500" />
                                승인 대기 ({pendingUsers.length})
                            </h2>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <AdminUserList users={pendingUsers} currentUserId={session.user.id} />
                            </div>
                        </div>
                    )}

                    {/* Active Members */}
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-600" />
                            활성 멤버 ({members.length})
                        </h2>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            {members.length > 0 ? (
                                <AdminUserList users={members} currentUserId={session.user.id} />
                            ) : (
                                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                                    승인된 멤버가 없습니다
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
