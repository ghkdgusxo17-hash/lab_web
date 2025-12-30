import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef } from 'react'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
    size?: 'sm' | 'md'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', size = 'md', ...props }, ref) => {
        const variants = {
            default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
            primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
            success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
            danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
            info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
        }

        const sizes = {
            sm: 'px-2 py-0.5 text-xs',
            md: 'px-2.5 py-1 text-xs',
        }

        return (
            <span
                ref={ref}
                className={cn(
                    'inline-flex items-center font-medium rounded-full',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        )
    }
)

Badge.displayName = 'Badge'

export { Badge }
