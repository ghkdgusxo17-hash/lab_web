'use client'

import { useState, useRef } from 'react'
import { ProfessorInfoData, EducationEntry, CareerEntry, updateProfessorInfo, uploadProfessorImage } from '@/actions/professor'
import { User, Plus, X, Save, Loader2, Upload, ImageIcon, GripVertical } from 'lucide-react'
import Image from 'next/image'

interface ProfessorInfoEditorProps {
    initialData: ProfessorInfoData
}

export function ProfessorInfoEditor({ initialData }: ProfessorInfoEditorProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [draggedEducationIndex, setDraggedEducationIndex] = useState<number | null>(null)
    const [draggedCareerIndex, setDraggedCareerIndex] = useState<number | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: initialData.name,
        position: initialData.position,
        department: initialData.department,
        university: initialData.university,
        profileImage: initialData.profileImage || '',
        email: initialData.email,
        phone: initialData.phone,
        labLocation: initialData.labLocation,
        education: initialData.education,
        career: initialData.career,
        researchKeywords: initialData.researchKeywords,
        researchDescription: initialData.researchDescription
    })

    const [newKeyword, setNewKeyword] = useState('')

    const handleSave = async () => {
        setIsSaving(true)
        setMessage(null)

        const result = await updateProfessorInfo({
            ...formData,
            profileImage: formData.profileImage || null
        })

        setIsSaving(false)

        if (result.success) {
            setMessage({ type: 'success', text: '교수 정보가 저장되었습니다.' })
            setTimeout(() => setMessage(null), 3000)
        } else {
            setMessage({ type: 'error', text: result.error || '저장에 실패했습니다.' })
        }
    }

    // Image upload handler
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        setMessage(null)

        const formData = new FormData()
        formData.append('file', file)

        const result = await uploadProfessorImage(formData)

        setIsUploading(false)

        if (result.success && result.url) {
            setFormData(prev => ({ ...prev, profileImage: result.url! }))
            setMessage({ type: 'success', text: '이미지가 업로드되었습니다.' })
            setTimeout(() => setMessage(null), 3000)
        } else {
            setMessage({ type: 'error', text: result.error || '이미지 업로드에 실패했습니다.' })
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // Education handlers
    const addEducation = () => {
        setFormData(prev => ({
            ...prev,
            education: [...prev.education, { degree: '', school: '', major: '', year: '' }]
        }))
    }

    const removeEducation = (index: number) => {
        setFormData(prev => ({
            ...prev,
            education: prev.education.filter((_, i) => i !== index)
        }))
    }

    const updateEducation = (index: number, field: keyof EducationEntry, value: string) => {
        setFormData(prev => ({
            ...prev,
            education: prev.education.map((edu, i) =>
                i === index ? { ...edu, [field]: value } : edu
            )
        }))
    }

    // Education drag handlers
    const handleEducationDragStart = (index: number) => {
        setDraggedEducationIndex(index)
    }

    const handleEducationDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (draggedEducationIndex === null || draggedEducationIndex === index) return

        setFormData(prev => {
            const newEducation = [...prev.education]
            const draggedItem = newEducation[draggedEducationIndex]
            newEducation.splice(draggedEducationIndex, 1)
            newEducation.splice(index, 0, draggedItem)
            return { ...prev, education: newEducation }
        })
        setDraggedEducationIndex(index)
    }

    const handleEducationDragEnd = () => {
        setDraggedEducationIndex(null)
    }

    // Career handlers
    const addCareer = () => {
        setFormData(prev => ({
            ...prev,
            career: [...prev.career, { position: '', organization: '', period: '' }]
        }))
    }

    const removeCareer = (index: number) => {
        setFormData(prev => ({
            ...prev,
            career: prev.career.filter((_, i) => i !== index)
        }))
    }

    const updateCareer = (index: number, field: keyof CareerEntry, value: string) => {
        setFormData(prev => ({
            ...prev,
            career: prev.career.map((job, i) =>
                i === index ? { ...job, [field]: value } : job
            )
        }))
    }

    // Career drag handlers
    const handleCareerDragStart = (index: number) => {
        setDraggedCareerIndex(index)
    }

    const handleCareerDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (draggedCareerIndex === null || draggedCareerIndex === index) return

        setFormData(prev => {
            const newCareer = [...prev.career]
            const draggedItem = newCareer[draggedCareerIndex]
            newCareer.splice(draggedCareerIndex, 1)
            newCareer.splice(index, 0, draggedItem)
            return { ...prev, career: newCareer }
        })
        setDraggedCareerIndex(index)
    }

    const handleCareerDragEnd = () => {
        setDraggedCareerIndex(null)
    }

    // Keyword handlers
    const addKeyword = () => {
        if (newKeyword.trim() && !formData.researchKeywords.includes(newKeyword.trim())) {
            setFormData(prev => ({
                ...prev,
                researchKeywords: [...prev.researchKeywords, newKeyword.trim()]
            }))
            setNewKeyword('')
        }
    }

    const removeKeyword = (keyword: string) => {
        setFormData(prev => ({
            ...prev,
            researchKeywords: prev.researchKeywords.filter(k => k !== keyword)
        }))
    }

    return (
        <div className="bg-white dark:bg-slate-900 t-rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    {formData.profileImage ? (
                        <Image
                            src={formData.profileImage}
                            alt={formData.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <User className="w-6 h-6 text-slate-400" />
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{formData.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{formData.position} · {formData.department}</p>
                    </div>
                </div>
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {isExpanded ? '접기' : '편집'}
                </span>
            </button>

            {/* Expanded Form */}
            {isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-800 p-6 space-y-8">
                    {/* Basic Info */}
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">기본 정보</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">성함</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 t-rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">직위</label>
                                <input
                                    type="text"
                                    value={formData.position}
                                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 t-rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">소속 대학교</label>
                                <input
                                    type="text"
                                    value={formData.university}
                                    onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 t-rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">소속 학과</label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 t-rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">프로필 이미지</label>
                                <div className="flex items-start gap-4">
                                    {/* Preview */}
                                    <div className="w-24 h-24 t-rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border-2 border-dashed border-slate-300 dark:border-slate-600">
                                        {formData.profileImage ? (
                                            <Image
                                                src={formData.profileImage}
                                                alt="프로필 미리보기"
                                                width={96}
                                                height={96}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-8 h-8 text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                    {/* Upload controls */}
                                    <div className="flex-1">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="professor-image-upload"
                                        />
                                        <label
                                            htmlFor="professor-image-upload"
                                            className={`inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium t-rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isUploading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    업로드 중...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-4 h-4" />
                                                    이미지 업로드
                                                </>
                                            )}
                                        </label>
                                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            JPG, PNG, GIF 파일을 업로드하세요.
                                        </p>
                                        {formData.profileImage && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, profileImage: '' }))}
                                                className="mt-2 text-xs text-red-500 hover:text-red-600"
                                            >
                                                이미지 제거
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">연락처</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">이메일</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 t-rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">전화번호</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 t-rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">연구실 위치</label>
                                <input
                                    type="text"
                                    value={formData.labLocation}
                                    onChange={(e) => setFormData(prev => ({ ...prev, labLocation: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 t-rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Education */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-900 dark:text-white">학력</h4>
                            <button
                                type="button"
                                onClick={addEducation}
                                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                                <Plus className="w-4 h-4" />
                                추가
                            </button>
                        </div>
                        <div className="space-y-4">
                            {formData.education.map((edu, index) => (
                                <div
                                    key={index}
                                    draggable
                                    onDragStart={() => handleEducationDragStart(index)}
                                    onDragOver={(e) => handleEducationDragOver(e, index)}
                                    onDragEnd={handleEducationDragEnd}
                                    className={`relative bg-slate-50 dark:bg-slate-800/50 t-rounded-xl p-4 pl-10 transition-opacity ${draggedEducationIndex === index ? 'opacity-50' : ''}`}
                                >
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
                                        <GripVertical className="w-5 h-5" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeEducation(index)}
                                        className="absolute top-3 right-3 p-1 text-slate-400 hover:text-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <input
                                            type="text"
                                            placeholder="학위 (예: 박사)"
                                            value={edu.degree}
                                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                            className="px-3 py-2 border border-slate-200 dark:border-slate-700 t-rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="학교명"
                                            value={edu.school}
                                            onChange={(e) => updateEducation(index, 'school', e.target.value)}
                                            className="px-3 py-2 border border-slate-200 dark:border-slate-700 t-rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="전공"
                                            value={edu.major}
                                            onChange={(e) => updateEducation(index, 'major', e.target.value)}
                                            className="px-3 py-2 border border-slate-200 dark:border-slate-700 t-rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="졸업연도"
                                            value={edu.year}
                                            onChange={(e) => updateEducation(index, 'year', e.target.value)}
                                            className="px-3 py-2 border border-slate-200 dark:border-slate-700 t-rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                        />
                                    </div>
                                </div>
                            ))}
                            {formData.education.length === 0 && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                                    학력 정보가 없습니다. '추가' 버튼을 클릭하여 추가하세요.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Career */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-900 dark:text-white">경력</h4>
                            <button
                                type="button"
                                onClick={addCareer}
                                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                                <Plus className="w-4 h-4" />
                                추가
                            </button>
                        </div>
                        <div className="space-y-4">
                            {formData.career.map((job, index) => (
                                <div
                                    key={index}
                                    draggable
                                    onDragStart={() => handleCareerDragStart(index)}
                                    onDragOver={(e) => handleCareerDragOver(e, index)}
                                    onDragEnd={handleCareerDragEnd}
                                    className={`relative bg-slate-50 dark:bg-slate-800/50 t-rounded-xl p-4 pl-10 transition-opacity ${draggedCareerIndex === index ? 'opacity-50' : ''}`}
                                >
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
                                        <GripVertical className="w-5 h-5" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeCareer(index)}
                                        className="absolute top-3 right-3 p-1 text-slate-400 hover:text-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input
                                            type="text"
                                            placeholder="직위"
                                            value={job.position}
                                            onChange={(e) => updateCareer(index, 'position', e.target.value)}
                                            className="px-3 py-2 border border-slate-200 dark:border-slate-700 t-rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="기관/회사명"
                                            value={job.organization}
                                            onChange={(e) => updateCareer(index, 'organization', e.target.value)}
                                            className="px-3 py-2 border border-slate-200 dark:border-slate-700 t-rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="기간 (예: 2018-2020)"
                                            value={job.period}
                                            onChange={(e) => updateCareer(index, 'period', e.target.value)}
                                            className="px-3 py-2 border border-slate-200 dark:border-slate-700 t-rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                        />
                                    </div>
                                </div>
                            ))}
                            {formData.career.length === 0 && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                                    경력 정보가 없습니다. '추가' 버튼을 클릭하여 추가하세요.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Research Keywords */}
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">연구 키워드</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {formData.researchKeywords.map((keyword) => (
                                <span
                                    key={keyword}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 t-rounded-full text-sm"
                                >
                                    {keyword}
                                    <button
                                        type="button"
                                        onClick={() => removeKeyword(keyword)}
                                        className="hover:text-red-500"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newKeyword}
                                onChange={(e) => setNewKeyword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                                placeholder="새 키워드 입력"
                                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 t-rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={addKeyword}
                                className="px-4 py-2.5 bg-blue-600 text-white font-medium t-rounded-xl hover:bg-blue-700"
                            >
                                추가
                            </button>
                        </div>
                    </div>

                    {/* Research Description */}
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">연구 분야 설명</h4>
                        <textarea
                            value={formData.researchDescription}
                            onChange={(e) => setFormData(prev => ({ ...prev, researchDescription: e.target.value }))}
                            rows={5}
                            placeholder="연구 분야에 대한 상세 설명을 입력하세요..."
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 t-rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                        {message && (
                            <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {message.text}
                            </p>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="ml-auto flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold t-rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    저장 중...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    저장
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
