import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { ArrowLeft } from 'lucide-react'
import { getPartition } from '@/actions/material-partition'
import { PartitionUploadSection } from './PartitionUploadSection'
import { PartitionMaterialList } from './PartitionMaterialList'
import { EditPartitionButton } from './EditPartitionButton'
import { DeletePartitionButton } from './DeletePartitionButton'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const partition = await getPartition(id)

    return {
        title: partition ? `${partition.emoji} ${partition.name} | 연구자료` : '연구자료',
        description: partition?.description || '파티션 자료',
    }
}

const categoryLabels: Record<string, string> = {
    DATA: '데이터',
    OTHER: '기타',
}

export default async function PartitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    const partition = await getPartition(id)

    if (!partition) {
        notFound()
    }

    const canUpload = session.user.isApproved || session.user.isAdmin
    const canEdit = partition.creatorId === session.user.id || session.user.isAdmin

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Link
                        href={`/materials?category=${partition.category}`}
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {categoryLabels[partition.category] || partition.category} 목록으로
                    </Link>

                    {/* Header */}
                    <div
                        className="rounded-xl border shadow-sm p-6 mb-6"
                        style={{
                            backgroundColor: `${partition.color}08`,
                            borderColor: `${partition.color}30`,
                        }}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                                        style={{ backgroundColor: `${partition.color}20` }}
                                    >
                                        {partition.emoji}
                                    </span>
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                                            {partition.name}
                                        </h1>
                                        <span
                                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                                            style={{
                                                backgroundColor: `${partition.color}20`,
                                                color: partition.color,
                                            }}
                                        >
                                            {categoryLabels[partition.category]}
                                        </span>
                                    </div>
                                </div>
                                {partition.description && (
                                    <p className="text-slate-600 dark:text-slate-400 mb-3">
                                        {partition.description}
                                    </p>
                                )}
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    {partition.creator.name} · {partition.materials.length}개 파일
                                </div>
                            </div>
                            {canEdit && (
                                <div className="flex items-center gap-2">
                                    <EditPartitionButton partition={partition} />
                                    <DeletePartitionButton
                                        partitionId={partition.id}
                                        category={partition.category}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload Section */}
                    {canUpload && (
                        <PartitionUploadSection partitionId={partition.id} />
                    )}

                    {/* Materials List */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            파일 목록 ({partition.materials.length})
                        </h2>
                        <PartitionMaterialList
                            materials={partition.materials}
                            currentUserId={session.user.id}
                            isAdmin={session.user.isAdmin}
                        />
                    </div>
                </div>
            </main>
        </>
    )
}
