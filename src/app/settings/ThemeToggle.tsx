'use client'

import { Sun, Moon, Monitor, Circle, Square } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

export function ThemeToggle() {
    const { theme, setTheme, designTheme, setDesignTheme } = useTheme()

    const colorOptions = [
        { value: 'light' as const, label: '라이트', icon: Sun },
        { value: 'dark' as const, label: '다크', icon: Moon },
        { value: 'system' as const, label: '시스템', icon: Monitor },
    ]

    const designOptions = [
        { value: 'soft' as const, label: 'Soft', icon: Circle, description: '둥글고 부드러운' },
        { value: 'sharp' as const, label: 'Sharp', icon: Square, description: '각지고 모던한' },
    ]

    return (
        <div className="space-y-6">
            {/* Color Theme */}
            <div className="bg-white dark:bg-slate-900 t-rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    화면 테마
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    밝기 모드를 선택하세요
                </p>

                <div className="grid grid-cols-3 gap-3">
                    {colorOptions.map((option) => {
                        const Icon = option.icon
                        const isSelected = theme === option.value

                        return (
                            <button
                                key={option.value}
                                onClick={() => setTheme(option.value)}
                                className={`
                                    flex flex-col items-center gap-2 p-4 t-rounded-xl border-2 transition-all
                                    ${isSelected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                                    }
                                `}
                            >
                                <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-500' : ''}`} />
                                <span className="text-sm font-medium">{option.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Design Theme */}
            <div className="bg-white dark:bg-slate-900 t-rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    디자인 스타일
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    UI 스타일을 선택하세요
                </p>

                <div className="grid grid-cols-2 gap-4">
                    {designOptions.map((option) => {
                        const Icon = option.icon
                        const isSelected = designTheme === option.value

                        return (
                            <button
                                key={option.value}
                                onClick={() => setDesignTheme(option.value)}
                                className={`
                                    relative flex flex-col items-center gap-3 p-6 border-2 transition-all
                                    ${option.value === 'soft' ? 'rounded-3xl' : 'rounded-sm'}
                                    ${isSelected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    }
                                `}
                            >
                                <div className={`
                                    w-12 h-12 flex items-center justify-center
                                    ${option.value === 'soft'
                                        ? 'rounded-full bg-gradient-to-br from-blue-500 to-cyan-500'
                                        : 'rounded-sm bg-slate-800 dark:bg-white'
                                    }
                                `}>
                                    <Icon className={`w-6 h-6 ${option.value === 'soft' ? 'text-white' : 'text-white dark:text-slate-900'}`} />
                                </div>
                                <div className="text-center">
                                    <p className={`text-base font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                                        {option.label}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {option.description}
                                    </p>
                                </div>
                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
