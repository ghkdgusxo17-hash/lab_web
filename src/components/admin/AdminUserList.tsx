'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, ShieldOff, UserCheck, UserX, Edit } from 'lucide-react'
import { updateUserRole, toggleUserAdmin, toggleUserApproval } from '@/actions/user'
import { UserAvatar } from '@/components/ui/UserAvatar'

type UserData = {
    id: string
    name: string | null
    email: string | null
    image: string | null
    role: string
    isAdmin: boolean
    isApproved: boolean
    createdAt: Date
}

const ROLES = [
    { value: 'PROFESSOR', label: '교수' },
    { value: 'PHD', label: '박사과정' },
    { value: 'MS', label: '석사과정' },
    { value: 'BS', label: '학부생' },
    { value: 'ALUMNI', label: '졸업생' },
]

function getPermissionBadge(user: UserData) {
    if (user.isAdmin) {
        return <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-blue-600 rounded-full">ADMIN</span>
    }
    if (user.isApproved) {
        return <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-green-600 rounded-full">MEMBER</span>
    }
    return <span className="px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 rounded-full">GUEST</span>
}

export function AdminUserList({ users, currentUserId }: { users: UserData[], currentUserId: string }) {
    const [loading, setLoading] = useState<string | null>(null)

    async function handleRoleChange(userId: string, newRole: string) {
        setLoading(userId)
        await updateUserRole(userId, newRole)
        setLoading(null)
    }

    async function handleToggleAdmin(userId: string) {
        setLoading(userId)
        await toggleUserAdmin(userId)
        setLoading(null)
    }

    async function handleToggleApproval(userId: string) {
        setLoading(userId)
        await toggleUserApproval(userId)
        setLoading(null)
    }

    return (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <div className="flex items-center justify-between">
                    <span>사용자</span>
                    <span>권한 관리</span>
                </div>
            </div>

            {users.map((user) => (
                <div key={user.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <UserAvatar src={user.image} name={user.name} size={48} className="object-cover border-2 border-slate-200 dark:border-slate-700 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white truncate">{user.name || '이름 없음'}</span>
                                {getPermissionBadge(user)}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end sm:justify-start">
                        {/* Edit button */}
                        <Link
                            href={`/admin/users/${user.id}`}
                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="정보 수정"
                        >
                            <Edit className="w-5 h-5" />
                        </Link>

                        {/* Role dropdown */}
                        <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={loading === user.id}
                            className="px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {ROLES.map((role) => (
                                <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                        </select>

                        {/* Approval toggle (Guest -> Member) */}
                        <button
                            onClick={() => handleToggleApproval(user.id)}
                            disabled={loading === user.id}
                            className={`p-2.5 rounded-xl transition-all disabled:opacity-50 ${user.isApproved
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            title={user.isApproved ? '회원 해제 (Guest로 변경)' : '회원 승인'}
                        >
                            {user.isApproved ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                        </button>

                        {/* Admin toggle */}
                        {user.id !== currentUserId && (
                            <button
                                onClick={() => handleToggleAdmin(user.id)}
                                disabled={loading === user.id}
                                className={`p-2.5 rounded-xl transition-all disabled:opacity-50 ${user.isAdmin
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                title={user.isAdmin ? '관리자 해제' : '관리자 승격'}
                            >
                                {user.isAdmin ? <Shield className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                </div>
            ))}

            {users.length === 0 && (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                    등록된 사용자가 없습니다.
                </div>
            )}
        </div>
    )
}
