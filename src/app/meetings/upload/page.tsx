import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TranscriptionUploadForm } from './TranscriptionUploadForm'
import { getMaterialsForTranscription, getLabMembers } from '@/actions/meeting-transcription'

export const metadata: Metadata = {
    title: '발표 녹음 업로드 | CPE Lab',
    description: '발표 녹음을 업로드하여 요약을 생성합니다',
}

export default async function TranscriptionUploadPage({
    searchParams
}: {
    searchParams: Promise<{ materialId?: string }>
}) {
    const { materialId } = await searchParams
    const session = await auth()

    if (!session?.user) {
        redirect('/api/auth/signin')
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        redirect('/meetings')
    }

    const materials = await getMaterialsForTranscription()
    const members = await getLabMembers()

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-2xl mx-auto">
                    {/* Back button */}
                    <Link
                        href="/meetings"
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        목록으로
                    </Link>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            발표 녹음 업로드
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            발표자료를 선택하고 녹음 파일을 업로드하면 자동으로 요약이 생성됩니다
                        </p>
                    </div>

                    {/* Upload Form */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
                        {materials.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-slate-600 dark:text-slate-400 mb-4">
                                    요약을 추가할 수 있는 발표자료가 없습니다.
                                </p>
                                <p className="text-sm text-slate-500">
                                    먼저 자료 페이지에서 랩미팅 자료를 업로드해주세요.
                                </p>
                                <Link
                                    href="/materials/upload"
                                    className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    자료 업로드하기
                                </Link>
                            </div>
                        ) : (
                            <TranscriptionUploadForm materials={materials} members={members} initialMaterialId={materialId} />
                        )}
                    </div>
                </div>
            </main>
        </>
    )
}
