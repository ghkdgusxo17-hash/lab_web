'use client'

import { useState } from 'react'
import { FolderKanban, FileText, FlaskConical, MoreHorizontal } from 'lucide-react'
import { createTask } from '@/actions/task'
import { RichTextEditor } from '@/components/editor'

interface Project {
    id: string
    name: string
}

interface TaskFormProps {
    projects: Project[]
}

const categories = [
    { value: 'PROJECT', label: '과제', icon: FolderKanban },
    { value: 'PAPER', label: '논문', icon: FileText },
    { value: 'EXPERIMENT', label: '실험', icon: FlaskConical },
    { value: 'OTHER', label: '기타', icon: MoreHorizontal },
]

export function TaskForm({ projects }: TaskFormProps) {
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [category, setCategory] = useState('OTHER')
    const [projectId, setProjectId] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData()
        formData.set('title', title)
        formData.set('content', content)
        formData.set('category', category)
        if (category === 'PROJECT' && projectId) {
            formData.set('projectId', projectId)
        }

        try {
            const result = await createTask(formData)
            if (result?.error) {
                alert(result.error)
                setLoading(false)
            }
        } catch (err: any) {
            if (err?.digest?.includes('NEXT_REDIRECT')) {
                throw err
            }
            console.error(err)
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    제목 *
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="작업 제목"
                />
            </div>

            {/* Category */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    카테고리
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {categories.map((cat) => {
                        const Icon = cat.icon
                        return (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => setCategory(cat.value)}
                                className={`flex flex-col items-center gap-1 p-3 rounded-xl text-sm font-medium transition-all ${category === cat.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {cat.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Project Selection (only for PROJECT category) */}
            {category === 'PROJECT' && projects.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        과제 선택 *
                    </label>
                    <select
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                        <option value="">과제를 선택해주세요</option>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Content - Rich Text Editor */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    내용 *
                </label>
                <RichTextEditor
                    content={content}
                    onChange={setContent}
                    placeholder="작업 내용을 상세히 작성해주세요... (Ctrl+V로 이미지 붙여넣기 가능)"
                    minHeight="200px"
                />
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={loading || !content.trim()}
                className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {loading ? '등록 중...' : '작업 등록'}
            </button>
        </form>
    )
}
