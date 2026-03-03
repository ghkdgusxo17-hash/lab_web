'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Mic, X, FileText, Calendar, User } from 'lucide-react'
import { createTranscription, updateMaterialPresenter } from '@/actions/meeting-transcription'

interface Material {
    id: string
    title: string
    filename: string
    uploader: { id: string; name: string | null }
    presenter: { id: string; name: string | null } | null
    labMeeting: { id: string; date: Date; title: string } | null
}

interface Member {
    id: string
    name: string | null
    role: string
}

interface Props {
    materials: Material[]
    members: Member[]
    initialMaterialId?: string
}

export function TranscriptionUploadForm({ materials, members, initialMaterialId }: Props) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(false)
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>(initialMaterialId || '')
    const [selectedPresenterId, setSelectedPresenterId] = useState<string>(() => {
        if (initialMaterialId) {
            const material = materials.find(m => m.id === initialMaterialId)
            return material?.presenter?.id || material?.uploader?.id || ''
        }
        return ''
    })
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const selectedMaterial = materials.find(m => m.id === selectedMaterialId)

    // Filter materials by search term
    const filteredMaterials = materials.filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.uploader.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.labMeeting?.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/flac', 'audio/ogg', 'audio/webm']
            if (!allowedTypes.some(type => file.type.includes(type.split('/')[1]) || file.name.endsWith('.m4a'))) {
                alert('지원하지 않는 오디오 형식입니다.\n(mp3, wav, m4a, flac, ogg, webm 지원)')
                return
            }
            setAudioFile(file)
        }
    }

    function handleRemoveFile() {
        setAudioFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    function handleSelectMaterial(materialId: string) {
        setSelectedMaterialId(materialId)
        const material = materials.find(m => m.id === materialId)
        if (material?.presenter) {
            setSelectedPresenterId(material.presenter.id)
        } else if (material?.uploader) {
            setSelectedPresenterId(material.uploader.id)
        }
    }

    const [uploadProgress, setUploadProgress] = useState<string | null>(null)

    const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB per chunk

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!selectedMaterialId) {
            alert('발표자료를 선택해주세요.')
            return
        }

        if (!audioFile) {
            alert('오디오 파일을 선택해주세요.')
            return
        }

        setLoading(true)

        try {
            // Update presenter if changed
            if (selectedPresenterId && selectedMaterial?.presenter?.id !== selectedPresenterId) {
                await updateMaterialPresenter(selectedMaterialId, selectedPresenterId || null)
            }

            // Step 1: Upload audio file in chunks (avoids Cloudflare QUIC timeout)
            const totalChunks = Math.ceil(audioFile.size / CHUNK_SIZE)
            const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
            let filePath = ''
            let originalFilename = audioFile.name

            for (let i = 0; i < totalChunks; i++) {
                setUploadProgress(`업로드 중... ${Math.round(((i + 1) / totalChunks) * 100)}%`)

                const start = i * CHUNK_SIZE
                const end = Math.min(start + CHUNK_SIZE, audioFile.size)
                const chunkBlob = audioFile.slice(start, end)

                const formData = new FormData()
                formData.set('chunk', chunkBlob)
                formData.set('uploadId', uploadId)
                formData.set('chunkIndex', String(i))
                formData.set('totalChunks', String(totalChunks))
                formData.set('filename', audioFile.name)

                const res = await fetch('/api/upload/audio', {
                    method: 'POST',
                    body: formData,
                })

                if (!res.ok) {
                    const err = await res.json()
                    throw new Error(err.error || `청크 ${i + 1} 업로드 실패`)
                }

                const result = await res.json()
                if (result.done) {
                    filePath = result.filePath
                    originalFilename = result.originalFilename
                }
            }

            if (!filePath) {
                throw new Error('파일 업로드 완료 응답을 받지 못했습니다.')
            }

            // Step 2: Create transcription record + start job (lightweight, no file transfer)
            setUploadProgress('트랜스크립션 시작 중...')
            const result = await createTranscription({
                materialId: selectedMaterialId,
                filePath,
                originalFilename,
            })

            if (result.error) {
                alert(result.error)
                setLoading(false)
                setUploadProgress(null)
            } else {
                router.push('/meetings')
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : '오류가 발생했습니다.')
            setLoading(false)
            setUploadProgress(null)
        }
    }

    function formatDate(date: Date) {
        return new Date(date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Material Selection */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    발표자료 선택 *
                </label>

                {/* Search */}
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="자료 검색..."
                    className="w-full px-4 py-2 mb-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                {/* Material List */}
                <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                    {filteredMaterials.length === 0 ? (
                        <p className="p-4 text-center text-slate-500">검색 결과가 없습니다</p>
                    ) : (
                        filteredMaterials.map((material) => (
                            <div
                                key={material.id}
                                onClick={() => handleSelectMaterial(material.id)}
                                className={`p-4 cursor-pointer border-b last:border-b-0 border-slate-100 dark:border-slate-800 transition-colors ${selectedMaterialId === material.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${selectedMaterialId === material.id
                                        ? 'bg-blue-100 dark:bg-blue-900/40'
                                        : 'bg-slate-100 dark:bg-slate-800'
                                        }`}>
                                        <FileText className={`w-5 h-5 ${selectedMaterialId === material.id
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : 'text-slate-500'
                                            }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium truncate ${selectedMaterialId === material.id
                                            ? 'text-blue-700 dark:text-blue-300'
                                            : 'text-slate-900 dark:text-white'
                                            }`}>
                                            {material.title}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {material.presenter?.name || material.uploader.name}
                                            </span>
                                            {material.labMeeting && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(material.labMeeting.date)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Presenter Selection (shown when material is selected) */}
            {selectedMaterial && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        발표자 (선택)
                    </label>
                    <select
                        value={selectedPresenterId}
                        onChange={(e) => setSelectedPresenterId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">발표자 선택...</option>
                        {members.map((member) => (
                            <option key={member.id} value={member.id}>
                                {member.name} ({member.role})
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-sm text-slate-500">
                        발표자가 업로더와 다른 경우 선택해주세요
                    </p>
                </div>
            )}

            {/* Audio File Upload */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    오디오 파일 *
                </label>

                {!audioFile ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                    >
                        <Mic className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                            클릭하여 오디오 파일 선택
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            mp3, wav, m4a, flac, ogg, webm
                        </p>
                    </div>
                ) : (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                            <Mic className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white truncate">
                                {audioFile.name}
                            </p>
                            <p className="text-sm text-slate-500">
                                {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg,.webm"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>처리 시간:</strong> 오디오 길이에 따라 10~30분 정도 소요됩니다.
                    처리가 완료되면 목록에서 확인할 수 있습니다.
                </p>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={loading || !selectedMaterialId || !audioFile}
                className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {uploadProgress || '처리 시작 중...'}
                    </>
                ) : (
                    <>
                        <Upload className="w-5 h-5" />
                        요약하기
                    </>
                )}
            </button>
        </form>
    )
}
