'use client'

interface RichContentViewerProps {
    content: string
    className?: string
}

export function RichContentViewer({ content, className = '' }: RichContentViewerProps) {
    return (
        <div
            className={`prose prose-slate dark:prose-invert max-w-none
                prose-img:rounded-xl prose-img:max-w-full prose-img:mx-auto
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-headings:font-bold prose-h2:text-xl prose-h3:text-lg
                ${className}`}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    )
}
