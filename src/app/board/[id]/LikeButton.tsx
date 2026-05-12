'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { togglePostLike } from '@/actions/post-interaction'

interface LikeButtonProps {
    postId: string
    initialCount: number
    initialLiked: boolean
    canLike: boolean
}

export function LikeButton({ postId, initialCount, initialLiked, canLike }: LikeButtonProps) {
    const [isPending, startTransition] = useTransition()
    const [count, setCount] = useState(initialCount)
    const [isLiked, setIsLiked] = useState(initialLiked)

    function handleClick() {
        if (!canLike) {
            alert('승인된 멤버만 추천할 수 있습니다.')
            return
        }

        // Optimistic update
        setIsLiked(!isLiked)
        setCount(isLiked ? count - 1 : count + 1)

        startTransition(async () => {
            const result = await togglePostLike(postId)
            if (result.error) {
                // Revert on error
                setIsLiked(isLiked)
                setCount(count)
                alert(result.error)
            }
        })
    }

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                isLiked
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            } disabled:opacity-50`}
        >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>추천</span>
            <span className="font-bold">{count}</span>
        </button>
    )
}
