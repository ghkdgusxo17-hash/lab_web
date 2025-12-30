'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Users, X, User } from 'lucide-react'
import Image from 'next/image'

interface Member {
    id: string
    name: string | null
    image: string | null
    _count: {
        materials: number
    }
}

interface MaterialMemberFilterProps {
    members: Member[]
    currentUserId: string
    currentCategory: string
    currentSearch: string
}

export function MaterialMemberFilter({ members, currentUserId, currentCategory, currentSearch }: MaterialMemberFilterProps) {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const handleSelectMember = (userId: string) => {
        const params = new URLSearchParams()
        if (currentCategory) params.set('category', currentCategory)
        if (currentSearch) params.set('search', currentSearch)
        if (userId) params.set('userId', userId)
        router.push(`/materials?${params.toString()}`)
        setIsOpen(false)
    }

    const handleClearMember = () => {
        const params = new URLSearchParams()
        if (currentCategory) params.set('category', currentCategory)
        if (currentSearch) params.set('search', currentSearch)
        router.push(`/materials?${params.toString()}`)
    }

    const selectedMember = members.find(m => m.id === currentUserId)

    return (
        <div className="relative">
            {currentUserId && selectedMember ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium">
                    {selectedMember.image ? (
                        <Image
                            src={selectedMember.image}
                            alt=""
                            width={20}
                            height={20}
                            className="w-5 h-5 rounded-full object-cover"
                        />
                    ) : (
                        <User className="w-4 h-4" />
                    )}
                    <span>{selectedMember.name}</span>
                    <button
                        onClick={handleClearMember}
                        className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <Users className="w-4 h-4" />
                    멤버별보기
                </button>
            )}

            {/* Member Dropdown */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 t-rounded-xl shadow-lg p-3 min-w-[200px]">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 px-1">
                            자료 업로드한 멤버
                        </p>
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                            {members.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => handleSelectMember(member.id)}
                                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    {member.image ? (
                                        <Image
                                            src={member.image}
                                            alt=""
                                            width={32}
                                            height={32}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                            <User className="w-4 h-4 text-slate-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {member.name || '익명'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {member._count.materials}개 자료
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
