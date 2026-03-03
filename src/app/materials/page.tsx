import { Metadata } from 'next'
import Link from 'next/link'
import { getMaterials, getMaterialUploaders } from '@/actions/material'
import { getPartitions } from '@/actions/material-partition'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { FileText, Upload, FolderOpen, Presentation, Database, File, ArrowLeft, Users } from 'lucide-react'
import { ChunkedDownloadButton } from '@/components/ui/ChunkedDownloadButton'
import { MaterialDeleteButton } from './MaterialDeleteButton'
import { MaterialSearch } from './MaterialSearch'
import { MaterialMemberFilter } from './MaterialMemberFilter'
import { PartitionCardGrid } from './PartitionCardGrid'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '연구자료 | CPE Lab',
    description: '연구 자료 및 문서 공유',
}

const CATEGORIES = [
    {
        key: 'PAPER',
        label: '논문',
        description: '논문 및 학술 자료',
        icon: FileText,
        color: 'text-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        href: '/materials/paper',
    },
    {
        key: 'PPT',
        label: 'PPT',
        description: '발표 자료 및 슬라이드',
        icon: Presentation,
        color: 'text-orange-600',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        href: '/materials?category=PPT',
    },
    {
        key: 'DATA',
        label: '데이터',
        description: '연구 데이터 및 결과물',
        icon: Database,
        color: 'text-green-600',
        bg: 'bg-green-50 dark:bg-green-900/20',
        href: '/materials?category=DATA',
    },
    {
        key: 'OTHER',
        label: '기타',
        description: '기타 연구 관련 자료',
        icon: File,
        color: 'text-slate-600',
        bg: 'bg-slate-100 dark:bg-slate-800',
        href: '/materials?category=OTHER',
    },
    {
        key: 'LAB_MEETING',
        label: 'Lab Meeting',
        description: '랩 미팅 발표 자료',
        icon: Users,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        href: '/materials/lab-meeting',
    },
]

function getCategoryInfo(key: string) {
    return CATEGORIES.find(c => c.key === key) ?? CATEGORIES[3]
}

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

interface MaterialsPageProps {
    searchParams: Promise<{ category?: string; userId?: string; search?: string }>
}

export default async function MaterialsPage({ searchParams }: MaterialsPageProps) {
    const { category, userId, search } = await searchParams
    const session = await auth()
    const canUpload = session?.user && (session.user.isApproved || session.user.isAdmin)

    // ── 카테고리 미선택: 카드 그리드 ──────────────────────────────
    if (!category) {
        return (
            <>
                <Navbar />
                <main className="min-h-screen pt-32 pb-20 px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                                    연구자료
                                </h1>
                                <p className="text-lg text-slate-600 dark:text-slate-300">
                                    연구에 필요한 자료를 공유합니다
                                </p>
                            </div>
                            {canUpload && (
                                <Link href="/materials/upload" className="btn-primary px-5 py-2.5 text-white text-sm">
                                    <Upload className="w-4 h-4" />
                                    자료 업로드
                                </Link>
                            )}
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {CATEGORIES.map((cat) => {
                                const Icon = cat.icon
                                return (
                                    <Link
                                        key={cat.key}
                                        href={cat.href}
                                        className="group bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                    >
                                        <div className={`w-12 h-12 rounded-2xl ${cat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            <Icon className={`w-6 h-6 ${cat.color}`} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                            {cat.label}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                            {cat.description}
                                        </p>
                                        <div className={`text-xs font-medium ${cat.color} group-hover:underline`}>
                                            자료 보기 →
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </main>
            </>
        )
    }

    // ── 카테고리 선택: 파일 목록 ───────────────────────────────────
    const hasPartitions = category === 'PPT' || category === 'DATA' || category === 'OTHER'

    const [materials, uploaders, partitions] = await Promise.all([
        getMaterials(category, userId || undefined, search || undefined, hasPartitions),
        getMaterialUploaders(),
        hasPartitions ? getPartitions(category) : Promise.resolve([]),
    ])
    const catInfo = getCategoryInfo(category)
    const Icon = catInfo.icon
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
                            <Link
                                href="/materials"
                                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                연구자료
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl ${catInfo.bg} flex items-center justify-center`}>
                                    <Icon className={`w-5 h-5 ${catInfo.color}`} />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                                    {catInfo.label}
                                </h1>
                            </div>
                        </div>
                        {canUpload && (
                            <Link href="/materials/upload" className="btn-primary px-5 py-2.5 text-white text-sm">
                                <Upload className="w-4 h-4" />
                                자료 업로드
                            </Link>
                        )}
                    </div>

                    {/* Partition Card Grid (DATA/OTHER only) */}
                    {hasPartitions && (
                        <PartitionCardGrid
                            partitions={partitions}
                            category={category}
                            canCreate={!!canUpload}
                        />
                    )}

                    {/* Unpartitioned file list label */}
                    {hasPartitions && (
                        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
                            미분류 자료
                        </h2>
                    )}

                    {/* List Container */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Filters */}
                        <div className="flex items-center justify-end gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <MaterialSearch
                                currentSearch={currentSearch}
                                currentCategory={category}
                                currentUserId={currentUserId}
                            />
                            <MaterialMemberFilter
                                members={uploaders}
                                currentUserId={currentUserId}
                                currentCategory={category}
                                currentSearch={currentSearch}
                            />
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
                                <p className="text-slate-500 dark:text-slate-400">
                                    {hasPartitions ? '미분류 자료가 없습니다' : '등록된 자료가 없습니다'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {materials.map((material: any, index: number) => {
                                    const canDelete = session?.user && (session.user.id === material.uploaderId || session.user.isAdmin)
                                    return (
                                        <div
                                            key={material.id}
                                            className="grid grid-cols-[60px_1fr_80px_100px_80px] md:grid-cols-[80px_1fr_100px_120px_100px] items-center px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                        >
                                            <div className="text-center text-sm text-slate-400 dark:text-slate-500">
                                                {materials.length - index}
                                            </div>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                                    {material.title}
                                                </span>
                                                <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                                                    {canUpload && (
                                                        <ChunkedDownloadButton
                                                            url={`/api/materials/${material.id}/download`}
                                                            filename={material.filename}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                        />
                                                    )}
                                                    {canDelete && (
                                                        <MaterialDeleteButton materialId={material.id} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                                                {formatFileSize(material.size)}
                                            </div>
                                            <div className="text-center text-sm text-slate-500 dark:text-slate-400 truncate">
                                                {material.uploader.name || '익명'}
                                            </div>
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
