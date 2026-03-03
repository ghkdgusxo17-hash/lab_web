'use client'

import { useState } from 'react'
import { toProxyImageUrl } from '@/lib/storage-constants'

interface UserAvatarProps {
    src?: string | null
    name?: string | null
    size?: number   // px (기본 32)
    className?: string
}

/**
 * 유저 프로필 이미지.
 * - Supabase 클라우드 URL → 로컬 프록시 URL 자동 변환
 * - 이미지 로드 실패 시 이름 첫 글자 fallback
 */
export function UserAvatar({ src, name, size = 32, className = '' }: UserAvatarProps) {
    const [failed, setFailed] = useState(false)
    const proxied = toProxyImageUrl(src)
    const initial = name ? name.charAt(0).toUpperCase() : '?'

    const sizeStyle = { width: size, height: size, minWidth: size }

    if (!proxied || failed) {
        return (
            <span
                style={sizeStyle}
                className={`inline-flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold select-none ${className}`}
            >
                <span style={{ fontSize: size * 0.45 }}>{initial}</span>
            </span>
        )
    }

    return (
        <img
            src={proxied}
            alt={name || ''}
            style={sizeStyle}
            className={`rounded-full object-cover ${className}`}
            onError={() => setFailed(true)}
        />
    )
}
