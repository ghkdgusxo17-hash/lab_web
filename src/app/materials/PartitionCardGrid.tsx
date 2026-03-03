'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { CreatePartitionModal } from './CreatePartitionModal'

interface Partition {
    id: string
    name: string
    description: string | null
    emoji: string
    color: string
    category: string
    materialsCount: number
    creator: {
        id: string
        name: string | null
        image: string | null
    }
}

interface Props {
    partitions: Partition[]
    category: string
    canCreate: boolean
}

export function PartitionCardGrid({ partitions, category, canCreate }: Props) {
    const [showCreate, setShowCreate] = useState(false)

    return (
        <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {partitions.map((partition) => (
                    <Link
                        key={partition.id}
                        href={`/materials/partition/${partition.id}`}
                        className="group relative p-5 rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                        style={{
                            backgroundColor: `${partition.color}06`,
                            borderColor: `${partition.color}25`,
                        }}
                    >
                        {/* Color accent bar */}
                        <div
                            className="absolute top-0 left-0 right-0 h-1 opacity-60 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: partition.color }}
                        />

                        <div className="flex items-start gap-3">
                            <span
                                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: `${partition.color}18` }}
                            >
                                {partition.emoji}
                            </span>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 dark:text-white truncate mb-0.5">
                                    {partition.name}
                                </h3>
                                {partition.description && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                                        {partition.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                                    <span
                                        className="font-medium px-1.5 py-0.5 rounded"
                                        style={{
                                            backgroundColor: `${partition.color}15`,
                                            color: partition.color,
                                        }}
                                    >
                                        {partition.materialsCount}개 파일
                                    </span>
                                    <span>·</span>
                                    <span>{partition.creator.name}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}

                {/* Create new partition card */}
                {canCreate && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="group p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-300 text-left"
                    >
                        <div className="flex items-center gap-3">
                            <span className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            </span>
                            <div>
                                <p className="font-semibold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    새 파티션 만들기
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">
                                    자료를 그룹으로 정리
                                </p>
                            </div>
                        </div>
                    </button>
                )}
            </div>

            {showCreate && (
                <CreatePartitionModal
                    category={category}
                    onClose={() => setShowCreate(false)}
                />
            )}
        </>
    )
}
