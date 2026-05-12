import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getMyWorkspaces, getAllWorkspaces } from '@/actions/workspace'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { Plus, Users, FolderOpen, Crown } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '협업공간 | CPE Lab',
    description: '팀별 자료 공유 및 협업',
}

export default async function WorkspacesPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/api/auth/signin')
    }
    if (session.user.role === 'ALUMNI') {
        redirect('/board')
    }

    const isAdmin = session.user.isAdmin
    const canCreate = session.user.isApproved || isAdmin
    // Admin sees all workspaces, others see only their own
    const workspaces = isAdmin ? await getAllWorkspaces() : await getMyWorkspaces()

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                협업공간
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                팀별 자료를 공유하고 협업하세요
                            </p>
                        </div>
                        {canCreate && (
                            <Link
                                href="/workspaces/new"
                                className="btn-primary px-5 py-2.5 text-white text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                새 협업공간
                            </Link>
                        )}
                    </div>

                    {/* Workspaces Grid */}
                    {workspaces.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 t-rounded-2xl p-16 text-center border border-slate-200 dark:border-slate-800">
                            <FolderOpen className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">협업공간이 없습니다</h3>
                            <p className="text-slate-500 mb-6">새 협업공간을 만들어 팀원들과 자료를 공유하세요</p>
                            {canCreate && (
                                <Link
                                    href="/workspaces/new"
                                    className="btn-primary px-5 py-2.5 text-white text-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    새 협업공간 만들기
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {workspaces.map((workspace: any) => (
                                <Link
                                    key={workspace.id}
                                    href={`/workspaces/${workspace.id}`}
                                    className="group bg-white dark:bg-slate-900 t-rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        {workspace.image ? (
                                            <img src={workspace.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 t-rounded-xl logo-container">
                                                <Users className="w-6 h-6 text-white" />
                                            </div>
                                        )}
                                        {workspace.isLeader && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
                                                <Crown className="w-3 h-3" />
                                                팀장
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                                        {workspace.name}
                                    </h3>
                                    {workspace.description && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                                            {workspace.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3.5 h-3.5" />
                                            {workspace.members.length}명
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FolderOpen className="w-3.5 h-3.5" />
                                            자료 {workspace._count.resources}개
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}
