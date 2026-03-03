'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateWorkspaceImage, removeWorkspaceImage } from '@/actions/workspace'
import { Camera, Trash2, Users } from 'lucide-react'

interface Props {
    workspaceId: string
    image: string | null
    canEdit: boolean
    size?: 'sm' | 'lg'
}

export function WorkspaceImageEditor({ workspaceId, image, canEdit, size = 'lg' }: Props) {
    const router = useRouter()
    const fileRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

    const dim = size === 'lg' ? 'w-16 h-16' : 'w-12 h-12'
    const iconDim = size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'
    const rounded = size === 'lg' ? 'rounded-2xl' : 'rounded-xl'

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        setShowMenu(false)
        const formData = new FormData()
        formData.set('image', file)
        const result = await updateWorkspaceImage(workspaceId, formData)
        if (result.error) alert(result.error)
        else router.refresh()
        setUploading(false)
        if (fileRef.current) fileRef.current.value = ''
    }

    async function handleRemove() {
        setShowMenu(false)
        setUploading(true)
        const result = await removeWorkspaceImage(workspaceId)
        if (result.error) alert(result.error)
        else router.refresh()
        setUploading(false)
    }

    return (
        <div className="relative group">
            {/* 이미지 / 기본 아이콘 */}
            {image ? (
                <img
                    src={image}
                    alt=""
                    className={`${dim} ${rounded} object-cover flex-shrink-0`}
                />
            ) : (
                <div className={`${dim} ${rounded} bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0`}>
                    <Users className={`${iconDim} text-white`} />
                </div>
            )}

            {/* 수정 오버레이 */}
            {canEdit && !uploading && (
                <button
                    onClick={() => setShowMenu(prev => !prev)}
                    className={`absolute inset-0 ${rounded} bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer`}
                >
                    <Camera className="w-5 h-5 text-white drop-shadow" />
                </button>
            )}

            {/* 로딩 오버레이 */}
            {uploading && (
                <div className={`absolute inset-0 ${rounded} bg-black/50 flex items-center justify-center`}>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* 드롭다운 메뉴 */}
            {showMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg z-50 overflow-hidden min-w-[140px]">
                        <button
                            onClick={() => fileRef.current?.click()}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <Camera className="w-4 h-4" />
                            사진 변경
                        </button>
                        {image && (
                            <button
                                onClick={handleRemove}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                사진 삭제
                            </button>
                        )}
                    </div>
                </>
            )}

            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    )
}
