import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { Plus, Mic, FileText, Calendar, User, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { getMaterialsWithTranscription } from '@/actions/meeting-transcription'

export const metadata: Metadata = {
    title: '발표 요약 | CPE Lab',
    description: '랩미팅 발표 녹음 및 요약',
}

export default async function MeetingsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/api/auth/signin')
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        redirect('/')
    }
    if (session.user.role === 'ALUMNI') {
        redirect('/board')
    }

    const materials = await getMaterialsWithTranscription()

    // Group materials by lab meeting
    const groupedByMeeting = materials.reduce((acc, material) => {
        const key = material.labMeeting?.id || 'no-meeting'
        if (!acc[key]) {
            acc[key] = {
                labMeeting: material.labMeeting,
                materials: []
            }
        }
        acc[key].materials.push(material)
        return acc
    }, {} as Record<string, { labMeeting: typeof materials[0]['labMeeting'], materials: typeof materials }>)

    // Sort by date (most recent first)
    const sortedGroups = Object.values(groupedByMeeting).sort((a, b) => {
        if (!a.labMeeting) return 1
        if (!b.labMeeting) return -1
        return new Date(b.labMeeting.date).getTime() - new Date(a.labMeeting.date).getTime()
    })

    function formatDate(date: Date) {
        return new Date(date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    function getStatusBadge(status: string | undefined) {
        if (!status) return null

        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        <Clock className="w-3 h-3" />
                        대기중
                    </span>
                )
            case 'PROCESSING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        처리중
                    </span>
                )
            case 'COMPLETED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        완료
                    </span>
                )
            case 'FAILED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <AlertCircle className="w-3 h-3" />
                        실패
                    </span>
                )
            default:
                return null
        }
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                발표 요약
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                랩미팅 발표 녹음을 업로드하고 AI 요약을 확인하세요
                            </p>
                        </div>
                        <Link
                            href="/meetings/upload"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            녹음 업로드
                        </Link>
                    </div>

                    {/* Content */}
                    {sortedGroups.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center">
                            <Mic className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-600 dark:text-slate-400 mb-2">
                                아직 랩미팅 자료가 없습니다
                            </p>
                            <p className="text-sm text-slate-500 mb-6">
                                먼저 자료 페이지에서 랩미팅 자료를 업로드해주세요
                            </p>
                            <Link
                                href="/materials/upload"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                자료 업로드하기
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {sortedGroups.map((group, groupIndex) => (
                                <div
                                    key={group.labMeeting?.id || `no-meeting-${groupIndex}`}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                                >
                                    {/* Meeting Header */}
                                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                        {group.labMeeting ? (
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                <div>
                                                    <h2 className="font-semibold text-slate-900 dark:text-white">
                                                        {group.labMeeting.title}
                                                    </h2>
                                                    <p className="text-sm text-slate-500">
                                                        {formatDate(group.labMeeting.date)}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <h2 className="font-semibold text-slate-900 dark:text-white">
                                                미분류 자료
                                            </h2>
                                        )}
                                    </div>

                                    {/* Materials List */}
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {group.materials.map((material) => (
                                            <div key={material.id} className="p-6">
                                                <div className="flex items-start gap-4">
                                                    {/* Icon */}
                                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                                        <FileText className="w-6 h-6 text-slate-500" />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <h3 className="font-medium text-slate-900 dark:text-white">
                                                                    {material.title}
                                                                </h3>
                                                                <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                                                    <User className="w-3 h-3" />
                                                                    {material.presenter?.name || material.uploader.name}
                                                                </p>
                                                            </div>
                                                            {getStatusBadge(material.transcription?.status)}
                                                        </div>

                                                        {/* Summary Preview */}
                                                        {material.transcription?.status === 'COMPLETED' && material.transcription.summary && (
                                                            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                                                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                                                                    {material.transcription.summary.slice(0, 200)}...
                                                                </p>
                                                                <Link
                                                                    href={`/meetings/${material.transcription.id}`}
                                                                    className="inline-block mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                                                >
                                                                    전체 보기 →
                                                                </Link>
                                                            </div>
                                                        )}

                                                        {/* No transcription yet */}
                                                        {!material.transcription && (
                                                            <Link
                                                                href={`/meetings/upload?materialId=${material.id}`}
                                                                className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                                            >
                                                                <Mic className="w-4 h-4" />
                                                                녹음 업로드
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}
