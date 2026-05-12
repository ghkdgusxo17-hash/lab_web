'use client'

import { useState, useTransition } from 'react'
import { toggleVideoEnabled } from '@/actions/settings'
import { Video, VideoOff } from 'lucide-react'

interface VideoToggleProps {
    initialEnabled: boolean
}

export function VideoToggle({ initialEnabled }: VideoToggleProps) {
    const [enabled, setEnabled] = useState(initialEnabled)
    const [isPending, startTransition] = useTransition()

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleVideoEnabled()
            if (result.success) {
                setEnabled(result.videoEnabled!)
            }
        })
    }

    return (
        <div className="bg-white dark:bg-slate-900 t-rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {enabled ? (
                        <div className="w-10 h-10 t-rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 t-rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <VideoOff className="w-5 h-5 text-slate-500" />
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">연구분야 동영상</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            연구실 소개 페이지에서 마우스 호버시 동영상 표시
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleToggle}
                    disabled={isPending}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                        } ${isPending ? 'opacity-50' : ''}`}
                >
                    <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                    />
                </button>
            </div>
            {enabled && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 t-rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>동영상 파일 위치:</strong> public/videos/ 폴더에 modeling.mp4, clc.mp4, ccus.mp4, psa.mp4 파일을 넣어주세요.
                    </p>
                </div>
            )}
        </div>
    )
}
