'use client'

import { useState, useRef } from 'react'
import { FlaskConical, Microscope, Target, Lightbulb, LucideIcon } from 'lucide-react'
import { PSACycleAnimation } from './PSACycleAnimation'

interface ResearchArea {
    icon: LucideIcon
    title: string
    description: string
    video: string
}

interface ResearchAreaGridProps {
    videoEnabled?: boolean
}

const RESEARCH_AREAS: ResearchArea[] = [
    {
        icon: FlaskConical,
        title: '화학 공정 모델링',
        description: '복잡한 화학 반응 및 공정 시스템의 수학적 모델링과 시뮬레이션을 통해 공정 최적화 및 스케일업 연구를 수행합니다. AI/머신러닝을 활용한 데이터 기반 모델링도 연구합니다.',
        video: '/videos/modeling.mp4',
    },
    {
        icon: Microscope,
        title: '수소 생산 기술 (CLC)',
        description: 'Chemical Looping Combustion(CLC) 기반 고효율 수소 생산 기술을 연구합니다. AI를 활용한 반응 조건 최적화 및 공정 설계 자동화를 개발하고 있습니다.',
        video: '/videos/clc.mp4',
    },
    {
        icon: Target,
        title: '탄소 포집 (CCUS)',
        description: 'Carbon Capture, Utilization and Storage(CCUS) 기술을 통한 탄소 중립 실현을 위해 연구합니다. 머신러닝 기반 흡착제 성능 예측 및 공정 최적화를 수행합니다.',
        video: '/videos/ccus.mp4',
    },
    {
        icon: Lightbulb,
        title: 'PSA 공정',
        description: 'Pressure Swing Adsorption(PSA) 공정을 활용한 가스 분리 및 정제 기술을 연구합니다. AI 기반 실시간 공정 제어 및 최적 운전 조건 도출을 연구합니다.',
        video: '/videos/psa.mp4',
    },
]

export function ResearchAreaGrid({ videoEnabled = false }: ResearchAreaGridProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [showPSA, setShowPSA] = useState(false)
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

    const handleMouseEnter = (index: number) => {
        if (!videoEnabled) return
        setHoveredIndex(index)
        const video = videoRefs.current[index]
        if (video) {
            video.currentTime = 0
            video.play().catch(() => { })
        }
    }

    const handleMouseLeave = () => {
        if (!videoEnabled) return
        if (hoveredIndex !== null) {
            const video = videoRefs.current[hoveredIndex]
            if (video) {
                video.pause()
            }
        }
        setHoveredIndex(null)
    }

    // When video is disabled, render simple grid
    if (!videoEnabled) {
        return (
            <>
                <div className="grid md:grid-cols-2 gap-6">
                    {RESEARCH_AREAS.map((area, index) => {
                        const Icon = area.icon
                        const isPSA = area.title === 'PSA 공정'
                        return (
                            <div
                                key={index}
                                className={`group bg-white dark:bg-slate-900 t-rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg ${isPSA ? 'cursor-pointer' : ''}`}
                                onClick={isPSA ? () => setShowPSA(true) : undefined}
                            >
                                <div className="w-12 h-12 t-rounded-xl logo-container mb-4 group-hover:scale-110 transition-transform">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                    {area.title}
                                    {isPSA && <span className="ml-2 text-xs font-normal text-blue-500 dark:text-blue-400">Interactive</span>}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                    {area.description}
                                </p>
                            </div>
                        )
                    })}
                </div>
                {showPSA && <PSACycleAnimation onClose={() => setShowPSA(false)} />}
            </>
        )
    }

    // When video is enabled, render with video hover functionality
    // PSA 카드는 클릭으로 인터랙티브 애니메이션 표시
    const handleCardClick = (index: number) => {
        if (RESEARCH_AREAS[index].title === 'PSA 공정') {
            setShowPSA(true)
        }
    }

    return (
        <div className="relative">
            {/* Grid Container */}
            <div className="grid md:grid-cols-2 gap-6">
                {RESEARCH_AREAS.map((area, index) => {
                    const Icon = area.icon
                    const isHovered = hoveredIndex === index
                    const isOtherHovered = hoveredIndex !== null && hoveredIndex !== index
                    const isPSA = area.title === 'PSA 공정'

                    return (
                        <div
                            key={index}
                            className={`relative transition-all duration-500 ease-out ${isOtherHovered ? 'opacity-0 scale-95 pointer-events-none' : ''
                                }`}
                            onMouseEnter={() => handleMouseEnter(index)}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => handleCardClick(index)}
                        >
                            {/* Normal Card */}
                            <div
                                className={`bg-white dark:bg-slate-900 t-rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer ${isHovered ? 'opacity-0' : ''
                                    }`}
                            >
                                <div className="w-12 h-12 t-rounded-xl logo-container mb-4">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                    {area.title}
                                    {isPSA && <span className="ml-2 text-xs font-normal text-blue-500 dark:text-blue-400">Interactive</span>}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                    {area.description}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Expanded Video Overlay */}
            {hoveredIndex !== null && (
                <div
                    className="absolute inset-0 z-20 transition-all duration-500"
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="w-full h-full t-rounded-3xl overflow-hidden bg-slate-900 shadow-2xl">
                        <video
                            ref={(el) => { videoRefs.current[hoveredIndex] = el }}
                            src={RESEARCH_AREAS[hoveredIndex].video}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            playsInline
                        />
                        {/* Title overlay at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                            <h3 className="text-2xl font-bold text-white">
                                {RESEARCH_AREAS[hoveredIndex].title}
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {showPSA && <PSACycleAnimation onClose={() => setShowPSA(false)} />}
        </div>
    )
}
