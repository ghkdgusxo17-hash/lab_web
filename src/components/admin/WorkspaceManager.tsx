'use client'

import { useState } from 'react'
import { Users, Crown, ChevronDown, ChevronUp } from 'lucide-react'
import { transferLeadership } from '@/actions/workspace'

interface WorkspaceMember {
    id: string
    isLeader: boolean
    user: {
        id: string
        name: string | null
        image: string | null
    }
}

interface Workspace {
    id: string
    name: string
    description: string | null
    members: WorkspaceMember[]
    isLeader: boolean
    isMember: boolean
}

interface WorkspaceManagerProps {
    workspaces: Workspace[]
}

export function WorkspaceManager({ workspaces }: WorkspaceManagerProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSetLeader(workspaceId: string, userId: string) {
        if (!confirm('이 멤버를 팀장으로 지정하시겠습니까?')) return
        setLoading(true)
        const result = await transferLeadership(workspaceId, userId)
        if (result?.error) {
            alert(result.error)
        }
        setLoading(false)
    }

    if (workspaces.length === 0) {
        return (
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-4 pl-3 border-l-4 border-purple-500">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        협업공간
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-sm font-bold text-purple-600 dark:text-purple-400">
                        0
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-900/30 shadow-xl shadow-slate-200/50 dark:shadow-none p-12 text-center text-slate-500">
                    협업공간이 없습니다
                </div>
            </div>
        )
    }

    return (
        <div className="mb-10">
            <div className="flex items-center gap-3 mb-4 pl-3 border-l-4 border-purple-500">
                <Users className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    협업공간
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-sm font-bold text-purple-600 dark:text-purple-400">
                    {workspaces.length}
                </span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-900/30 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {workspaces.map((workspace) => {
                    const leader = workspace.members.find(m => m.isLeader)
                    const isExpanded = expandedId === workspace.id

                    return (
                        <div key={workspace.id}>
                            <button
                                onClick={() => setExpandedId(isExpanded ? null : workspace.id)}
                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                            >
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">
                                        {workspace.name}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                        <span>{workspace.members.length}명</span>
                                        {leader && (
                                            <span className="flex items-center gap-1 text-amber-600">
                                                <Crown className="w-3.5 h-3.5" />
                                                {leader.user.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                            </button>

                            {isExpanded && (
                                <div className="px-6 pb-4 bg-slate-50 dark:bg-slate-800/30">
                                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                                        팀장 지정
                                    </div>
                                    <div className="space-y-2">
                                        {workspace.members.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {member.user.image ? (
                                                        <img src={member.user.image} alt="" className="w-8 h-8 rounded-full" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-500">
                                                            {member.user.name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-slate-900 dark:text-white">
                                                        {member.user.name}
                                                    </span>
                                                    {member.isLeader && (
                                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
                                                            <Crown className="w-3 h-3" />
                                                            팀장
                                                        </span>
                                                    )}
                                                </div>
                                                {!member.isLeader && (
                                                    <button
                                                        onClick={() => handleSetLeader(workspace.id, member.user.id)}
                                                        disabled={loading}
                                                        className="px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        팀장 지정
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
