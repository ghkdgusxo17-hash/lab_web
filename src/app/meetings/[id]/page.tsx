import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { ArrowLeft, Calendar, User, FileText, Clock, Mic } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { TranscriptionDetail } from './TranscriptionDetail'

export const metadata: Metadata = {
    title: '발표 요약 상세 | CPE Lab',
    description: '발표 요약 및 트랜스크립션 상세 보기',
}

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function TranscriptionDetailPage({ params }: PageProps) {
    const session = await auth()

    if (!session?.user) {
        redirect('/api/auth/signin')
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        redirect('/')
    }

    const { id } = await params

    const transcription = await prisma.meetingTranscription.findUnique({
        where: { id },
        include: {
            material: {
                include: {
                    uploader: { select: { id: true, name: true } },
                    presenter: { select: { id: true, name: true } },
                    labMeeting: { select: { id: true, date: true, title: true } }
                }
            },
            recorder: { select: { id: true, name: true } }
        }
    })

    if (!transcription) {
        notFound()
    }

    function formatDate(date: Date) {
        return new Date(date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    function formatDateTime(date: Date) {
        return new Date(date).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const presenter = transcription.material.presenter || transcription.material.uploader

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Back button */}
                    <Link
                        href="/meetings"
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        목록으로
                    </Link>

                    {/* Header */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 mb-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                    {transcription.material.title}
                                </h1>
                                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        발표: {presenter.name}
                                    </span>
                                    {transcription.material.labMeeting && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(transcription.material.labMeeting.date)}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        생성: {formatDateTime(transcription.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Lab Meeting Info */}
                        {transcription.material.labMeeting && (
                            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    <span className="font-medium">{transcription.material.labMeeting.title}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <TranscriptionDetail
                        transcription={{
                            id: transcription.id,
                            status: transcription.status,
                            summary: transcription.summary,
                            transcript: transcription.transcript,
                            error: transcription.error,
                            audioUrl: transcription.audioUrl,
                            audioFilename: transcription.audioFilename
                        }}
                    />
                </div>
            </main>
        </>
    )
}
