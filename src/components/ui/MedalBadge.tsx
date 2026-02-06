'use client'

import { useRef, useCallback } from 'react'
import { getMedalTier } from '@/lib/medal'

interface MedalBadgeProps {
    medalPoints: number
    size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
}

const sizeImgClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
}

export function MedalBadge({ medalPoints, size = 'sm' }: MedalBadgeProps) {
    const clickTimesRef = useRef<number[]>([])

    const tier = getMedalTier(medalPoints)

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        const now = Date.now()
        clickTimesRef.current.push(now)
        // 최근 1초 내의 클릭만 유지
        clickTimesRef.current = clickTimesRef.current.filter(t => now - t < 1000)
        if (clickTimesRef.current.length >= 5) {
            clickTimesRef.current = []
            try {
                new Audio('/sounds/medal-sound.mp3').play()
            } catch {
                // 오디오 재생 실패 무시
            }
        }
    }, [])

    if (!tier) return null

    const nextInfo = tier.level >= 4 ? null
        : tier.level === 3 ? { name: '명예훈장', need: 10 - medalPoints }
        : tier.level === 2 ? { name: '금훈장', need: 7 - medalPoints }
        : { name: '은훈장', need: 4 - medalPoints }

    const tooltip = nextInfo
        ? `${tier.name} (${medalPoints}pt) · ${nextInfo.name}까지 ${nextInfo.need}pt`
        : `${tier.name} (${medalPoints}pt) · MAX`

    return (
        <span
            className={`inline-flex items-center cursor-pointer select-none ${tier.className} ${sizeClasses[size]}`}
            onClick={handleClick}
            title={tooltip}
        >
            {tier.isLegendary ? (
                <img
                    src="/images/medal-legendary.png"
                    alt={tier.name}
                    className={sizeImgClasses[size]}
                />
            ) : (
                tier.emoji
            )}
        </span>
    )
}
