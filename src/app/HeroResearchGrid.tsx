'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'

const CLICK_THRESHOLD = 5
const CLICK_TIMEOUT = 3000 // 3초 안에 5번 클릭

export function HeroResearchGrid() {
    const [clickCount, setClickCount] = useState(0)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        setIsMobile(window.innerWidth < 768)
    }, [])

    // Reset click count after timeout
    useEffect(() => {
        if (clickCount === 0) return
        const timer = setTimeout(() => setClickCount(0), CLICK_TIMEOUT)
        return () => clearTimeout(timer)
    }, [clickCount])

    const handleHydrogenClick = useCallback(() => {
        if (isMobile) return
        const next = clickCount + 1
        if (next >= CLICK_THRESHOLD) {
            setClickCount(0)
            const w = 900
            const h = 750
            const left = (screen.width - w) / 2
            const top = (screen.height - h) / 2
            window.open(
                '/powdertoy/index.html',
                'PowderHail',
                `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
            )
        } else {
            setClickCount(next)
        }
    }, [clickCount, isMobile])

    const items = [
        { src: '/images/research-ccs.png', alt: 'Process Design', label: 'Process Design', sub: '공정 설계', scaleClass: 'scale-110' },
        { src: '/images/research-clc.png', alt: 'Hydrogen CLC', label: '수소생산', sub: 'CLC 기반', scaleClass: '', isHydrogen: true },
        { src: '/images/research-psa.png', alt: 'PSA Separation', label: '분리 공정', sub: 'PSA/SMB', scaleClass: 'scale-125' },
        { src: '/images/research-absorption.png', alt: 'Absorption Process', label: '흡수 공정', sub: 'Amine-based', scaleClass: '' },
    ]

    return (
        <div className="grid grid-cols-2 gap-2 w-full h-full">
            {items.map((item) => (
                <div
                    key={item.alt}
                    className={`bg-slate-50 dark:bg-slate-800 t-rounded-2xl p-2 flex flex-col items-center border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform ${item.isHydrogen && !isMobile ? 'cursor-pointer select-none' : 'cursor-default'}`}
                    onClick={item.isHydrogen ? handleHydrogenClick : undefined}
                >
                    <div className="flex-1 w-full relative">
                        <Image
                            src={item.src}
                            alt={item.alt}
                            fill
                            className={`object-contain ${item.scaleClass}`}
                            draggable={false}
                        />
                    </div>
                    <div className="text-base font-bold text-slate-900 dark:text-white">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.sub}</div>
                </div>
            ))}
        </div>
    )
}
