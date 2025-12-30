
import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { FolderPlus, Info } from 'lucide-react'
import { getAllWorkspaces, getWorkspace, createWorkspace } from '@/actions/workspace'
import { SectionManager } from '@/components/workspace/SectionManager'
import { ResourceUpload } from '@/components/workspace/ResourceUpload'
import { MaterialTabs } from '@/components/materials/MaterialTabs'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Lab Meeting | CPE Lab',
    description: 'Lab Meeting materials and archives',
}

export default async function LabMeetingPage({ searchParams }: { searchParams: Promise<{ category?: string; userId?: string; search?: string }> }) {
    const { category, userId, search } = await searchParams
    const session = await auth()
    const currentCategory = '' // This page is its own category effectively
    const currentUserId = userId || ''
    const currentSearch = search || ''

    // 1. Find "Lab Meeting" workspace
    const allWorkspaces = await getAllWorkspaces()
    const targetWorkspace = allWorkspaces.find(w => w.name === 'Lab Meeting')

    let workspaceData = null
    if (targetWorkspace) {
        workspaceData = await getWorkspace(targetWorkspace.id)
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                연구자료
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                연구에 필요한 자료를 공유합니다
                            </p>
                        </div>
                    </div>

                    {/* Board Container */}
                    <div className="bg-white dark:bg-slate-900 t-rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Tabs */}
                        <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pr-4">
                            <MaterialTabs
                                currentCategory={currentCategory}
                                currentUserId={currentUserId}
                                currentSearch={currentSearch}
                                isLabMeetingActive={true}
                            />
                        </div>

                        {/* Content Area */}
                        <div className="p-6">
                            {workspaceData ? (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                                                Lab Meeting
                                            </h2>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                                랩 미팅 자료 아카이브
                                            </p>
                                        </div>
                                    </div>

                                    {/* Workspace Content */}
                                    {workspaceData.canViewResources ? (
                                        <>
                                            <ResourceUpload
                                                workspaceId={workspaceData.id}
                                                sections={workspaceData.sections}
                                            />
                                            <SectionManager
                                                workspaceId={workspaceData.id}
                                                sections={workspaceData.sections as any}
                                                unsectionedResources={workspaceData.resources as any}
                                                isLeader={workspaceData.isLeader}
                                                isMember={workspaceData.isMember}
                                                currentUserId={session?.user?.id || ''}
                                            />
                                        </>
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <Info className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">접근 권한이 없습니다</h3>
                                            <p className="text-slate-500 dark:text-slate-400 mb-6">
                                                이 공간의 멤버가 되어야 자료를 볼 수 있습니다.
                                            </p>
                                            {/* Link to actual workspace page to join/request? */}
                                            <Link
                                                href={`/workspaces/${workspaceData.id}`}
                                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                협업 공간으로 이동하여 가입하기
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <FolderPlus className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                        Lab Meeting 공간이 없습니다
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                                        아직 'Lab Meeting'이라는 이름의 협업 공간이 생성되지 않았습니다.
                                    </p>

                                    {(session?.user?.isAdmin || session?.user?.isApproved) && (
                                        <form action={async (formData) => {
                                            'use server'
                                            await createWorkspace(formData)
                                        }}>
                                            <input type="hidden" name="name" value="Lab Meeting" />
                                            <input type="hidden" name="description" value="공식 랩 미팅 자료 저장소" />
                                            <button
                                                type="submit"
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                                            >
                                                <FolderPlus className="w-5 h-5" />
                                                Lab Meeting 공간 생성하기
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
