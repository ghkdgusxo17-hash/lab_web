'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteWorkspace, leaveWorkspace } from '@/actions/workspace'
import { Trash2, LogOut, Loader2 } from 'lucide-react'

interface WorkspaceActionsProps {
    workspaceId: string
    workspaceName: string
    isLeader: boolean
    isAdmin: boolean
    isMember: boolean
}

export function WorkspaceActions({ workspaceId, workspaceName, isLeader, isAdmin, isMember }: WorkspaceActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [isLeaving, setIsLeaving] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
    const router = useRouter()

    const canDelete = isLeader || isAdmin
    const canLeave = isMember && !isLeader // Leaders can't leave, they need to transfer leadership first

    const handleDelete = async () => {
        setIsDeleting(true)
        const result = await deleteWorkspace(workspaceId)
        if (result.success) {
            router.push('/workspaces')
        } else {
            alert(result.error || '삭제에 실패했습니다.')
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    const handleLeave = async () => {
        setIsLeaving(true)
        const result = await leaveWorkspace(workspaceId)
        if (result.success) {
            router.push('/workspaces')
        } else {
            alert(result.error || '나가기에 실패했습니다.')
            setIsLeaving(false)
            setShowLeaveConfirm(false)
        }
    }

    if (!canDelete && !canLeave) return null

    return (
        <div className="flex items-center gap-2">
            {/* Leave Button (for members, not leaders) */}
            {canLeave && (
                <>
                    {showLeaveConfirm ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <span className="text-sm text-orange-700 dark:text-orange-400">나가기?</span>
                            <button
                                onClick={handleLeave}
                                disabled={isLeaving}
                                className="px-2 py-1 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded transition-colors"
                            >
                                {isLeaving ? <Loader2 className="w-3 h-3 animate-spin" /> : '확인'}
                            </button>
                            <button
                                onClick={() => setShowLeaveConfirm(false)}
                                className="px-2 py-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                            >
                                취소
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowLeaveConfirm(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            나가기
                        </button>
                    )}
                </>
            )}

            {/* Delete Button (for leaders and admins) */}
            {canDelete && (
                <>
                    {showDeleteConfirm ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <span className="text-sm text-red-700 dark:text-red-400">정말 삭제?</span>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-2 py-1 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                            >
                                {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : '삭제'}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-2 py-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                            >
                                취소
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            삭제
                        </button>
                    )}
                </>
            )}
        </div>
    )
}
