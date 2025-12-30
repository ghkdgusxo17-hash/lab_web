'use client'

import { useState } from 'react'
import { FolderKanban, Plus, Trash2, Power, PowerOff, X, UserPlus, UserMinus, Users } from 'lucide-react'
import { createProject, deleteProject, toggleProjectActive, assignMemberToProject, removeMemberFromProject } from '@/actions/project'

interface Member {
    id: string
    name: string | null
    image: string | null
}

interface ProjectMember {
    id: string
    user: Member
}

interface Project {
    id: string
    name: string
    description: string | null
    isActive: boolean
    members: ProjectMember[]
    createdAt: Date
}

interface ProjectManagerProps {
    projects: Project[]
    allMembers: Member[]
}

export function ProjectManager({ projects, allMembers }: ProjectManagerProps) {
    const [showForm, setShowForm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [expandedProject, setExpandedProject] = useState<string | null>(null)
    const [addingMember, setAddingMember] = useState<string | null>(null)
    const [selectedMember, setSelectedMember] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData()
        formData.set('name', name)
        formData.set('description', description)

        const result = await createProject(formData)

        if (result.error) {
            alert(result.error)
        } else {
            setName('')
            setDescription('')
            setShowForm(false)
        }
        setLoading(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('이 과제를 삭제하면 관련된 모든 작업도 영향을 받습니다. 정말 삭제하시겠습니까?')) return
        await deleteProject(id)
    }

    async function handleToggle(id: string) {
        await toggleProjectActive(id)
    }

    async function handleAssignMember(projectId: string) {
        if (!selectedMember) return
        setLoading(true)
        await assignMemberToProject(projectId, selectedMember)
        setSelectedMember('')
        setAddingMember(null)
        setLoading(false)
    }

    async function handleRemoveMember(projectId: string, userId: string) {
        if (!confirm('이 멤버를 과제에서 제거하시겠습니까?')) return
        await removeMemberFromProject(projectId, userId)
    }

    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 pl-3 border-l-4 border-purple-500">
                    <FolderKanban className="w-5 h-5 text-purple-600" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        과제 관리
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-sm font-bold text-purple-600 dark:text-purple-400">
                        {projects.length}
                    </span>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 transition-colors text-sm"
                >
                    <Plus className="w-4 h-4" />
                    새 과제
                </button>
            </div>

            {/* New Project Form */}
            {showForm && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6 mb-4 border border-purple-100 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900 dark:text-white">새 과제 등록</h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">과제명 *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                placeholder="과제명"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">설명 (선택)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                                placeholder="과제에 대한 간단한 설명"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? '등록 중...' : '과제 등록'}
                        </button>
                    </form>
                </div>
            )}

            {/* Projects List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-900/30 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                {projects.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {projects.map((project) => {
                            const isExpanded = expandedProject === project.id
                            const assignedMemberIds = new Set(project.members.map(m => m.user.id))
                            const availableMembers = allMembers.filter(m => !assignedMemberIds.has(m.id))

                            return (
                                <div key={project.id} className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-2 h-2 rounded-full mt-2 ${project.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-bold ${project.isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                                    {project.name}
                                                </h4>
                                                <button
                                                    onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                                                    className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full transition-colors ${isExpanded ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    <Users className="w-3 h-3" />
                                                    {project.members.length}명
                                                </button>
                                            </div>
                                            {project.description && (
                                                <p className={`text-sm mt-0.5 ${project.isActive ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400'}`}>
                                                    {project.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggle(project.id)}
                                                className={`p-2 rounded-lg transition-colors ${project.isActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                                title={project.isActive ? '비활성화' : '활성화'}
                                            >
                                                {project.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(project.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="삭제"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Members Section */}
                                    {isExpanded && (
                                        <div className="mt-4 pl-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">할당된 멤버</span>
                                                {addingMember !== project.id ? (
                                                    <button
                                                        onClick={() => setAddingMember(project.id)}
                                                        className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                                        title="멤버 추가"
                                                    >
                                                        <UserPlus className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setAddingMember(null)}
                                                        className="p-1 text-slate-400 hover:bg-slate-100 rounded transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Add Member Form */}
                                            {addingMember === project.id && (
                                                <div className="flex gap-2 mb-3">
                                                    <select
                                                        value={selectedMember}
                                                        onChange={(e) => setSelectedMember(e.target.value)}
                                                        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                    >
                                                        <option value="">멤버 선택</option>
                                                        {availableMembers.map(m => (
                                                            <option key={m.id} value={m.id}>{m.name || '이름 없음'}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => handleAssignMember(project.id)}
                                                        disabled={!selectedMember || loading}
                                                        className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                                    >
                                                        추가
                                                    </button>
                                                </div>
                                            )}

                                            {/* Member List */}
                                            {project.members.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {project.members.map((pm) => (
                                                        <div key={pm.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                                                            {pm.user.image ? (
                                                                <img src={pm.user.image} alt="" className="w-5 h-5 rounded-full" />
                                                            ) : (
                                                                <div className="w-5 h-5 rounded-full bg-slate-300" />
                                                            )}
                                                            <span className="text-sm text-slate-700 dark:text-slate-300">{pm.user.name}</span>
                                                            <button
                                                                onClick={() => handleRemoveMember(project.id, pm.user.id)}
                                                                className="p-0.5 text-slate-400 hover:text-red-500 transition-colors"
                                                                title="제거"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400">할당된 멤버가 없습니다</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                        등록된 과제가 없습니다
                    </div>
                )}
            </div>
        </div>
    )
}
