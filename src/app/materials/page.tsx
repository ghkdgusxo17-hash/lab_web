import { Metadata } from 'next'
import Link from 'next/link'
import { getMaterials, getMaterialUploaders } from '@/actions/material'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { FileText, Upload, Download, FolderOpen, Presentation, Database, File } from 'lucide-react'
import { MaterialDeleteButton } from './MaterialDeleteButton'
import { MaterialSearch } from './MaterialSearch'
import { MaterialMemberFilter } from './MaterialMemberFilter'
import { MaterialTabs } from '@/components/materials/MaterialTabs'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '연구자료 | CPE Lab',
    description: '연구 자료 및 문서 공유',
}

const MATERIAL_TYPES = [
    { key: '', label: '전체' },
    { key: 'PAPER', label: '논문' },
    { key: 'PPT', label: 'PPT' },
    { key: 'DATA', label: '데이터' },
    { key: 'LAB_MEETING', label: 'Lab Meeting' },
    { key: 'OTHER', label: '기타' },
]

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).replace(/\. /g, '.').replace(/\.$/, '')
}

function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getCategoryLabel(category: string) {
    switch (category) {
        case 'PAPER': return { label: '논문', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' }
        case 'PPT': return { label: 'PPT', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' }
        case 'DATA': return { label: '데이터', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' }
        case 'LAB_MEETING': return { label: 'Lab Meeting', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' }
        default: return { label: '기타', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' }
    }
}

interface MaterialsPageProps {
    searchParams: Promise<{ category?: string; userId?: string; search?: string }>
}

export default async function MaterialsPage({ searchParams }: MaterialsPageProps) {
    const { category, userId, search } = await searchParams
    const session = await auth()
    const [materials, uploaders] = await Promise.all([
        getMaterials(category || undefined, userId || undefined, search || undefined),
        getMaterialUploaders()
    ])
    const canUpload = session?.user && (session.user.isApproved || session.user.isAdmin)
    const currentCategory = category || ''
    const currentUserId = userId || ''
    const currentSearch = search || ''

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
                        {canUpload && (
                            <Link
                                href="/materials/upload"
                                className="btn-primary px-5 py-2.5 text-white text-sm"
                            >
                                <Upload className="w-4 h-4" />
                                자료 업로드
                            </Link>
                        )}
                    </div>

                    {/* Board Container */}
                    <div className="bg-white dark:bg-slate-900 t-rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Tabs and Filters */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pr-4">
                            {/* Category Tabs */}
                            <MaterialTabs
                                currentCategory={currentCategory}
                                currentUserId={currentUserId}
                                currentSearch={currentSearch}
                            />

                            {/* Search and Member Filter */}
                            <div className="flex items-center gap-3 py-2">
                                <MaterialSearch
                                    currentSearch={currentSearch}
                                    currentCategory={currentCategory}
                                    currentUserId={currentUserId}
                                />
                                <MaterialMemberFilter
                                    members={uploaders}
                                    currentUserId={currentUserId}
                                    currentCategory={currentCategory}
                                    currentSearch={currentSearch}
                                />
                            </div>
                        </div>

                        {/* Table Header */}
                        <div className="grid grid-cols-[60px_1fr_80px_100px_80px] md:grid-cols-[80px_1fr_100px_120px_100px] items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <div className="text-center">번호</div>
                            <div>제목</div>
                            <div className="text-center">크기</div>
                            <div className="text-center">작성자</div>
                            <div className="text-center">날짜</div>
                        </div>

                        {/* Materials */}
                        {materials.length === 0 ? (
                            <div className="py-16 text-center">
                                <FolderOpen className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400">등록된 자료가 없습니다</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {materials.map((material: any, index: number) => {
                                    const categoryLabel = getCategoryLabel(material.category)
                                    const canDelete = session?.user && (session.user.id === material.uploaderId || session.user.isAdmin)

                                    return (
                                        <div
                                            key={material.id}
                                            className="grid grid-cols-[60px_1fr_80px_100px_80px] md:grid-cols-[80px_1fr_100px_120px_100px] items-center px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                        >
                                            {/* Number */}
                                            <div className="text-center text-sm text-slate-400 dark:text-slate-500">
                                                {materials.length - index}
                                            </div>

                                            {/* Title */}
                                            <div className="flex items-center gap-2 min-w-0">
                                                {!currentCategory && (
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${categoryLabel.color} flex-shrink-0`}>
                                                        {categoryLabel.label}
                                                    </span>
                                                )}
                                                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                                    {material.title}
                                                </span>
                                                <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                                                    {canUpload && (
                                                        <a
                                                            href={`/api/materials/${material.id}/download`}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                            title="다운로드"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    {canDelete && (
                                                        <MaterialDeleteButton materialId={material.id} />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Size */}
                                            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                                                {formatFileSize(material.size)}
                                            </div>

                                            {/* Author */}
                                            <div className="text-center text-sm text-slate-500 dark:text-slate-400 truncate">
                                                {material.uploader.name || '익명'}
                                            </div>

                                            {/* Date */}
                                            <div className="text-center text-sm text-slate-400 dark:text-slate-500">
                                                {formatDate(material.createdAt)}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    )
}
