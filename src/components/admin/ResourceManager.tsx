'use client'

import { useState } from 'react'
import { Resource } from '@prisma/client'
import { Plus, Pencil, Trash2, Server, ImageIcon, X, Loader2 } from 'lucide-react'
import { createResource, updateResource, deleteResource, uploadResourceImage, toggleResourceAvailability } from '@/actions/resource'
import Image from 'next/image'

interface ResourceManagerProps {
    resources: Resource[]
}

export function ResourceManager({ resources: initialResources }: ResourceManagerProps) {
    const [resources, setResources] = useState(initialResources)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingResource, setEditingResource] = useState<Resource | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form State
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState('EQUIPMENT')
    const [isAvailable, setIsAvailable] = useState(true)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const resetForm = () => {
        setName('')
        setDescription('')
        setType('EQUIPMENT')
        setIsAvailable(true)
        setImageFile(null)
        setImagePreview(null)
        setEditingResource(null)
    }

    const handleOpenDialog = (resource?: Resource) => {
        if (resource) {
            setEditingResource(resource)
            setName(resource.name)
            setDescription(resource.description || '')
            setType(resource.type)
            setIsAvailable(resource.isAvailable)
            setImagePreview(resource.image)
        } else {
            resetForm()
        }
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        resetForm()
        setIsDialogOpen(false)
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            let imageUrl = editingResource?.image || null

            // Upload image if selected
            if (imageFile) {
                const formData = new FormData()
                formData.set('file', imageFile)
                const uploadResult = await uploadResourceImage(formData)
                if (uploadResult.error || !uploadResult.url) {
                    alert(uploadResult.error || '이미지 업로드 실패')
                    setIsLoading(false)
                    return
                }
                imageUrl = uploadResult.url
            }

            const data = {
                name,
                description,
                type,
                image: imageUrl || undefined,
                isAvailable
            }

            let result
            if (editingResource) {
                result = await updateResource(editingResource.id, data)
            } else {
                result = await createResource(data as any)
            }

            if (result.error) {
                alert(result.error)
            } else {
                handleCloseDialog()
                // Optimistic update or refresh page would be better, but revalidatePath handles server side.
                // Since this is client state, we should strictly rely on props update or refresh.
                // For now, let's refresh the page to get new data or wait for parent update?
                // Actually server action's revalidatePath updates the page component, but not this client component state immediately unless we use router.refresh()
                window.location.reload()
            }
        } catch (error) {
            console.error(error)
            alert('오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return
        const result = await deleteResource(id)
        if (result.success) {
            window.location.reload()
        } else {
            alert(result.error)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={() => handleOpenDialog()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    새 장비 추가
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {resources.map((resource) => (
                    <div
                        key={resource.id}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 relative group"
                    >
                        <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleOpenDialog(resource)}
                                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 hover:text-blue-600 transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(resource.id)}
                                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden relative border border-slate-100 dark:border-slate-700">
                                {resource.image ? (
                                    <Image
                                        src={resource.image}
                                        alt={resource.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Server className="w-8 h-8 text-slate-300" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                    {resource.name}
                                </h3>
                                <div className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${resource.isAvailable
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {resource.isAvailable ? '예약 가능' : '점검중/불가'}
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                            {resource.description}
                        </p>
                    </div>
                ))}
            </div>

            {/* Dialog */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editingResource ? '장비 수정' : '새 장비 추가'}
                            </h2>
                            <button onClick={handleCloseDialog} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                                    이미지
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-blue-500 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        {imagePreview ? (
                                            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-slate-400" />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-white text-xs font-medium">변경</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                                            장비 사진을 업로드하세요.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                                            className="text-sm font-medium text-blue-600 hover:underline"
                                        >
                                            파일 선택
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                                    장비명 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="예: HPLC Analysis"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                                    설명
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="장비에 대한 설명을 입력하세요"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="EQUIPMENT"
                                        checked={type === 'EQUIPMENT'}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-slate-900 dark:text-white">장비</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="ROOM"
                                        checked={type === 'ROOM'}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-slate-900 dark:text-white">공간/회의실</span>
                                </label>
                            </div>

                            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isAvailable}
                                    onChange={(e) => setIsAvailable(e.target.checked)}
                                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white">예약 가능</div>
                                    <div className="text-xs text-slate-500">체크 해제 시 예약이 불가능합니다</div>
                                </div>
                            </label>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseDialog}
                                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                                    disabled={isLoading}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
                                    disabled={isLoading}
                                >
                                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingResource ? '수정 저장' : '장비 추가'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
