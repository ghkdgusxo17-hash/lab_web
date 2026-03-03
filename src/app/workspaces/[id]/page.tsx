import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getWorkspace } from '@/actions/workspace'
import { getInvitableMembers } from '@/actions/member'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { ArrowLeft, Users, Crown, FolderOpen } from 'lucide-react'
import { MemberManager } from '@/components/workspace/MemberManager'
import { ResourceUpload } from '@/components/workspace/ResourceUpload'
import { SectionManager } from '@/components/workspace/SectionManager'
import { WorkspaceActions } from '@/components/workspace/WorkspaceActions'
import { WorkspaceImageEditor } from '@/components/workspace/WorkspaceImageEditor'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const workspace = await getWorkspace(id)
    return {
        title: workspace ? `${workspace.name} | 협업공간` : '협업공간',
    }
}

interface WorkspaceDetailPageProps {
    params: Promise<{ id: string }>
}

export default async function WorkspaceDetailPage({ params }: WorkspaceDetailPageProps) {
    const { id } = await params
    const session = await auth()

    const workspace = await getWorkspace(id)

    if (!workspace) {
        notFound()
    }

    const isLoggedIn = !!session?.user
    const isAdmin = session?.user?.isAdmin || false

    // Get all members for the member selector (if member or admin)
    let allMembers: any[] = []
    if (workspace.isMember || isAdmin) {
        allMembers = await getInvitableMembers()
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Back button */}
                    <Link
                        href="/workspaces"
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        협업공간 목록
                    </Link>

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                        <div className="flex items-start gap-4">
                            <WorkspaceImageEditor
                                workspaceId={id}
                                image={workspace.image ?? null}
                                canEdit={workspace.isLeader || isAdmin}
                                size="lg"
                            />
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                        {workspace.name}
                                    </h1>
                                    {workspace.isLeader && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
                                            <Crown className="w-3 h-3" />
                                            팀장
                                        </span>
                                    )}
                                </div>
                                {workspace.description && (
                                    <p className="text-slate-600 dark:text-slate-400">
                                        {workspace.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Workspace Actions (Delete/Leave) */}
                        <WorkspaceActions
                            workspaceId={id}
                            workspaceName={workspace.name}
                            isLeader={workspace.isLeader}
                            isAdmin={isAdmin}
                            isMember={workspace.isMember}
                        />
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Members & Resources */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Resources Section */}
                            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <FolderOpen className="w-5 h-5 text-blue-500" />
                                        공유 자료
                                        {workspace.canViewResources && (
                                            <span className="px-2 py-0.5 text-sm rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                                                {workspace.resources.length}
                                            </span>
                                        )}
                                    </h2>
                                </div>

                                {workspace.canViewResources ? (
                                    <>
                                        {workspace.isMember && <ResourceUpload workspaceId={id} sections={(workspace.sections || []) as any} />}

                                        <SectionManager
                                            workspaceId={id}
                                            sections={(workspace.sections || []) as any}
                                            unsectionedResources={(workspace.resources || []).filter((r: any) => !r.sectionId) as any}
                                            isLeader={workspace.isLeader}
                                            isMember={workspace.isMember}
                                            currentUserId={session?.user?.id || ''}
                                        />
                                    </>
                                ) : (
                                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500 font-medium">멤버만 자료를 볼 수 있습니다</p>
                                        {!isLoggedIn && (
                                            <Link href="/api/auth/signin" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
                                                로그인하기
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Sidebar - Members */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sticky top-24">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Users className="w-5 h-5 text-blue-500" />
                                        멤버
                                        <span className="px-2 py-0.5 text-sm rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                                            {workspace.members.length}
                                        </span>
                                    </h2>
                                </div>

                                <MemberManager
                                    workspaceId={id}
                                    members={workspace.members}
                                    allMembers={allMembers}
                                    isLeader={workspace.isLeader}
                                    isAdmin={isAdmin}
                                    isMember={workspace.isMember}
                                    currentUserId={session?.user?.id || ''}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
