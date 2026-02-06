import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { ArrowLeft, Calendar, Users, Edit, Trash2 } from 'lucide-react'
import { getLabMeeting, getApprovedMembers } from '@/actions/lab-meeting'
import { MaterialUploadSection } from './MaterialUploadSection'
import { MaterialList } from './MaterialList'
import { DeleteMeetingButton } from './DeleteMeetingButton'
import { MedalAwardSection } from './MedalAwardSection'
import { MedalBadge } from '@/components/ui/MedalBadge'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const meeting = await getLabMeeting(id)

    return {
        title: meeting ? `${meeting.title} | Lab Meeting` : 'Lab Meeting',
        description: meeting?.description || 'Lab meeting materials',
    }
}

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    })
}

export default async function LabMeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    const meeting = await getLabMeeting(id)

    if (!meeting) {
        notFound()
    }

    const canUpload = session.user.isApproved || session.user.isAdmin
    const canEdit = session.user.isApproved || session.user.isAdmin
    const canDelete = session.user.isAdmin

    // 자료별 발표자 목록 (중복 제거)
    const materialPresenters = (() => {
        const map = new Map<string, { id: string; name: string | null; image: string | null }>()
        for (const m of meeting.materials) {
            const presenter = (m as any).presenter
            if (presenter) {
                map.set(presenter.id, presenter)
            }
        }
        return Array.from(map.values())
    })()

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Link
                        href="/materials/lab-meeting"
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        랩미팅 목록으로
                    </Link>

                    {/* Header */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-3 py-1 rounded-full">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(meeting.date)}
                                    </span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                                    {meeting.title}
                                </h1>
                                {meeting.description && (
                                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                                        {meeting.description}
                                    </p>
                                )}
                                {meeting.presenters.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm text-slate-500 dark:text-slate-400">발표자:</span>
                                        <div className="flex items-center gap-2">
                                            {meeting.presenters.map((presenter) => (
                                                <span
                                                    key={presenter.id}
                                                    className="inline-flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full"
                                                >
                                                    {presenter.image ? (
                                                        <img
                                                            src={presenter.image}
                                                            alt={presenter.name || ''}
                                                            className="w-5 h-5 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                                    )}
                                                    {presenter.name}
                                                    {' '}<MedalBadge medalPoints={(presenter as any).medalPoints || 0} size="sm" />
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {canEdit && (
                                    <Link
                                        href={`/materials/lab-meeting/${id}/edit`}
                                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                        title="수정"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </Link>
                                )}
                                {canDelete && (
                                    <DeleteMeetingButton meetingId={id} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Medal Award Section (Admin only) */}
                    {session.user.isAdmin && (
                        <MedalAwardSection
                            labMeetingId={id}
                            presenters={materialPresenters}
                            existingAwards={(meeting as any).medalAwards || []}
                        />
                    )}

                    {/* Upload Section */}
                    {canUpload && (
                        <MaterialUploadSection labMeetingId={id} />
                    )}

                    {/* Materials List */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            업로드된 자료 ({meeting.materials.length})
                        </h2>
                        <MaterialList
                            materials={meeting.materials}
                            currentUserId={session.user.id}
                            isAdmin={session.user.isAdmin}
                        />
                    </div>
                </div>
            </main>
        </>
    )
}
