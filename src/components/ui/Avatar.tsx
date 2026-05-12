'use client'

import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef, useState } from 'react'

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
    src?: string
    alt?: string
    fallback?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
    ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
        const [imageError, setImageError] = useState(false)

        const sizes = {
            sm: 'w-8 h-8 text-xs',
            md: 'w-10 h-10 text-sm',
            lg: 'w-14 h-14 text-base',
            xl: 'w-20 h-20 text-xl',
        }

        const getInitials = (name: string) => {
            return name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
        }

        return (
            <div
                ref={ref}
                className={cn(
                    'relative rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary-400 to-accent-400 text-white font-semibold',
                    sizes[size],
                    className
                )}
                {...props}
            >
                {src && !imageError ? (
                    <img
                        src={src}
                        alt={alt || 'Avatar'}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <span>{fallback ? getInitials(fallback) : '?'}</span>
                )}
            </div>
        )
    }
)

Avatar.displayName = 'Avatar'

export { Avatar }
