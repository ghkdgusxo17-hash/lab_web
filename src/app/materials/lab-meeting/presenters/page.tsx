import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Eye,
    FileText,
    FolderOpen,
    Search,
    Users,
} from 'lucide-react'
import { auth } from '@/auth'
import { getLabMeetingPresenterArchive } from '@/actions/lab-meeting'
import { Navbar } from '@/components/layout'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { MedalBadge } from '@/components/ui/MedalBadge'
import { isOnlyOfficeViewable } from '@/lib/onlyoffice-shared'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: '발표자별 Lab Meeting 자료 | CPE Lab',
    description: '랩미팅 발표 자료를 발표자별로 모아봅니다',
}

const categoryLabels: Record<string, string> = {
    PPT: 'PPT',
    PAPER: '논문',
    DATA: '데이터',
    OTHER: '기타',
}

const statusLabels: Record<string, string> = {
    PENDING: '요약 대기',
    PROCESSING: '요약 중',
    COMPLETED: '요약 완료',
    FAILED: '요약 실패',
}

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).replace(/\. /g, '.').replace(/\.$/, '')
}

function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface PageProps {
    searchParams: Promise<{ search?: string; presenterId?: string }>
}

export default async function LabMeetingPresenterArchivePage({ searchParams }: PageProps) {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    if (session.user.role === 'ALUMNI') {
        redirect('/board')
    }

    const canView = session.user.isApproved || session.user.isAdmin
    const params = await searchParams
    const search = params.search?.trim() || ''
    const presenterId = params.presenterId?.trim() || ''

    const archive = canView
        ? await getLabMeetingPresenterArchive({ search, presenterId })
        : { groups: [], presenterOptions: [], totalMaterials: 0, totalPresenters: 0 }

    const totalMeetings = new Set(
        archive.groups.flatMap((group) => group.materials.map((material) => material.labMeeting?.id).filter(Boolean))
    ).size

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                        <div>
                            <Link
                                href="/materials/lab-meeting"
                                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Lab Meeting
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                                        발표자별 자료
                                    </h1>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        랩미팅에서 누가 어떤 자료를 발표했는지 한 곳에서 확인합니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!canView ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                승인된 멤버만 볼 수 있습니다
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                랩미팅 발표 자료 아카이브는 승인 멤버와 관리자에게 공개됩니다.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid sm:grid-cols-3 gap-3 mb-6">
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">발표자</div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{archive.totalPresenters}</div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">발표 자료</div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{archive.totalMaterials}</div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">연결된 랩미팅</div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalMeetings}</div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                    <form action="/materials/lab-meeting/presenters" className="flex flex-col md:flex-row gap-3">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                name="search"
                                                defaultValue={search}
                                                placeholder="자료 제목, 파일명, 랩미팅 제목 검색"
                                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <select
                                            name="presenterId"
                                            defaultValue={presenterId}
                                            className="md:w-56 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">전체 발표자</option>
                                            {archive.presenterOptions.map((presenter) => (
                                                <option key={presenter.id} value={presenter.id}>
                                                    {presenter.name || '이름 없음'}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            검색
                                        </button>
                                        {(search || presenterId) && (
                                            <Link
                                                href="/materials/lab-meeting/presenters"
                                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                                            >
                                                초기화
                                            </Link>
                                        )}
                                    </form>
                                </div>

                                {archive.groups.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                            표시할 자료가 없습니다
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            랩미팅 자료에서 발표자를 지정하면 이 화면에 모입니다.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {archive.groups.map((group) => (
                                            <section key={group.presenter.id} className="p-5">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <UserAvatar src={group.presenter.image} name={group.presenter.name} size={42} />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                                    {group.presenter.name || '이름 없음'}
                                                                </h2>
                                                                <MedalBadge medalPoints={group.presenter.medalPoints || 0} size="sm" />
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                                <span>{group.presenter.role || 'Member'}</span>
                                                                <span>자료 {group.materialCount}개</span>
                                                                {group.latestDate && <span>최근 {formatDate(group.latestDate)}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    {group.materials.map((material) => {
                                                        const meeting = material.labMeeting
                                                        const canOpenViewer = Boolean(meeting && isOnlyOfficeViewable(material.filename, material.mimeType))

                                                        return (
                                                            <div
                                                                key={material.id}
                                                                className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                                            >
                                                                <div className="min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                                            <FileText className="w-3 h-3" />
                                                                            {categoryLabels[material.category] || material.category}
                                                                        </span>
                                                                        {material.transcription && (
                                                                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                                                                                {material.transcription.status === 'COMPLETED' ? (
                                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                                ) : (
                                                                                    <Clock className="w-3 h-3" />
                                                                                )}
                                                                                {statusLabels[material.transcription.status] || material.transcription.status}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                                                        {material.title}
                                                                    </h3>
                                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                        {meeting && (
                                                                            <span className="inline-flex items-center gap-1">
                                                                                <Calendar className="w-3.5 h-3.5" />
                                                                                {formatDate(meeting.date)} · {meeting.title}
                                                                            </span>
                                                                        )}
                                                                        <span>{formatFileSize(material.size)}</span>
                                                                        <span>{material.filename}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {meeting && (
                                                                        <Link
                                                                            href={`/materials/lab-meeting/${meeting.id}`}
                                                                            className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                                        >
                                                                            랩미팅
                                                                        </Link>
                                                                    )}
                                                                    {canOpenViewer && meeting && (
                                                                        <Link
                                                                            href={`/materials/lab-meeting/${meeting.id}/materials/${material.id}/viewer`}
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors"
                                                                        >
                                                                            <Eye className="w-4 h-4" />
                                                                            열기
                                                                        </Link>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </section>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </>
    )
}
