'use client'

import { useState } from 'react'
import { cleanupStorage } from '@/actions/admin'
import { Trash2, Loader2, Database, AlertCircle, CheckCircle } from 'lucide-react'

export function StorageCleanupPanel() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message: string; details?: string[] } | null>(null)

    async function handleCleanup() {
        if (!confirm('경고: 사용되지 않는 파일들이 영구적으로 삭제됩니다. 계속하시겠습니까?')) return

        setLoading(true)
        setResult(null)

        try {
            const res = await cleanupStorage()
            if (res.error) {
                setResult({ success: false, message: res.error })
            } else {
                setResult({
                    success: true,
                    message: res.message || '저장소 정리가 완료되었습니다.',
                    details: res.details
                })
            }
        } catch (error) {
            setResult({ success: false, message: '오류가 발생했습니다.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Database className="w-5 h-5 text-indigo-600" />
                        저장소 정리
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        DB에 연결되지 않은 고아(Orphaned) 파일들을 찾아 삭제합니다.
                    </p>
                </div>
                <button
                    onClick={handleCleanup}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Trash2 className="w-4 h-4" />
                    )}
                    {loading ? '정리 중...' : '파일 정리 시작'}
                </button>
            </div>

            {result && (
                <div className={`p-4 rounded-xl text-sm ${result.success
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    }`}>
                    <div className="flex items-start gap-3">
                        {result.success ? (
                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                            <p className="font-bold mb-1">{result.message}</p>
                            {result.details && result.details.length > 0 && (
                                <ul className="list-disc list-inside space-y-0.5 opacity-80 mt-2 text-xs">
                                    {result.details.map((detail, idx) => (
                                        <li key={idx}>{detail}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
