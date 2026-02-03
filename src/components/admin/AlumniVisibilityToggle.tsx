'use client'

import { useState, useTransition } from 'react'
import { toggleAlumniVisibility } from '@/actions/member'
import { Eye, EyeOff } from 'lucide-react'

interface AlumniVisibilityToggleProps {
    initialVisible: boolean
}

export function AlumniVisibilityToggle({ initialVisible }: AlumniVisibilityToggleProps) {
    const [visible, setVisible] = useState(initialVisible)
    const [isPending, startTransition] = useTransition()

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleAlumniVisibility()
            if (!result.error) {
                setVisible(!visible)
            }
        })
    }

    return (
        <div className="bg-white dark:bg-slate-900 t-rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {visible ? (
                        <div className="w-10 h-10 t-rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 t-rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <EyeOff className="w-5 h-5 text-slate-500" />
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">졸업생 공개 설정</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            외부 방문자에게 졸업생 목록 표시 여부
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleToggle}
                    disabled={isPending}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${visible ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                        } ${isPending ? 'opacity-50' : ''}`}
                >
                    <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${visible ? 'translate-x-5' : 'translate-x-0'
                            }`}
                    />
                </button>
            </div>
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 t-rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    {visible ? (
                        <><strong className="text-emerald-600 dark:text-emerald-400">공개:</strong> 로그인하지 않은 방문자도 졸업생 목록을 볼 수 있습니다.</>
                    ) : (
                        <><strong className="text-slate-500">비공개:</strong> 승인된 멤버만 졸업생 목록을 볼 수 있습니다.</>
                    )}
                </p>
            </div>
        </div>
    )
}
