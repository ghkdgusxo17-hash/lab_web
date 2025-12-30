'use client'

import { useState } from 'react'
import { Crown, X, UserPlus } from 'lucide-react'
import { addWorkspaceMember, removeWorkspaceMember } from '@/actions/workspace'

interface Member {
    id: string
    isLeader: boolean
    user: {
        id: string
        name: string | null
        image: string | null
        email: string | null
    }
}

interface MemberManagerProps {
    workspaceId: string
    members: Member[]
    allMembers: { id: string; name: string | null; image: string | null }[]
    isLeader: boolean
    isAdmin: boolean
    isMember: boolean
    currentUserId: string
}

export function MemberManager({ workspaceId, members, allMembers, isLeader, isMember }: MemberManagerProps) {
    const [showAddForm, setShowAddForm] = useState(false)
    const [selectedMember, setSelectedMember] = useState('')
    const [loading, setLoading] = useState(false)

    const memberIds = new Set(members.map(m => m.user.id))
    const availableMembers = allMembers.filter(m => !memberIds.has(m.id))

    async function handleAddMember() {
        if (!selectedMember) return
        setLoading(true)
        await addWorkspaceMember(workspaceId, selectedMember)
        setSelectedMember('')
        setShowAddForm(false)
        setLoading(false)
    }

    async function handleRemoveMember(userId: string) {
        if (!confirm('이 멤버를 제거하시겠습니까?')) return
        await removeWorkspaceMember(workspaceId, userId)
    }

    return (
        <div className="space-y-3">
            {/* Member List */}
            {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {member.user.image ? (
                        <img src={member.user.image} alt="" className="w-9 h-9 rounded-full" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-500">
                            {member.user.name?.charAt(0) || '?'}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-900 dark:text-white text-sm truncate">
                                {member.user.name}
                            </span>
                            {member.isLeader && (
                                <Crown className="w-3.5 h-3.5 text-amber-500" />
                            )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">{member.user.email}</p>
                    </div>
                    {/* Leader can remove non-leader members */}
                    {isLeader && !member.isLeader && (
                        <button
                            onClick={() => handleRemoveMember(member.user.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="멤버 제거"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ))}

            {/* Add Member - any member can invite */}
            {isMember && (
                <>
                    {showAddForm ? (
                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <select
                                value={selectedMember}
                                onChange={(e) => setSelectedMember(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mb-2"
                            >
                                <option value="">멤버 선택</option>
                                {availableMembers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddMember}
                                    disabled={!selectedMember || loading}
                                    className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    추가
                                </button>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-100"
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-blue-600 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            멤버 추가
                        </button>
                    )}
                </>
            )}
        </div>
    )
}
