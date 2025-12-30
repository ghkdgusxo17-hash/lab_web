import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'elevated'
    hover?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', hover = false, children, ...props }, ref) => {
        const variants = {
            default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
            glass: 'glass',
            elevated: 'bg-white dark:bg-slate-900 shadow-xl',
        }

        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-2xl p-6',
                    variants[variant],
                    hover && 'hover-lift cursor-pointer',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
)

Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('mb-4', className)} {...props} />
    )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3 ref={ref} className={cn('text-xl font-bold', className)} {...props} />
    )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p ref={ref} className={cn('text-sm text-slate-500 dark:text-slate-400', className)} {...props} />
    )
)
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('', className)} {...props} />
    )
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('mt-4 flex items-center gap-2', className)} {...props} />
    )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
