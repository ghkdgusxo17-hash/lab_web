'use client'

import { useState } from 'react'
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB per chunk

interface ChunkedDownloadButtonProps {
    url: string
    filename: string
    className?: string
    children?: React.ReactNode
}

export function ChunkedDownloadButton({ url, filename, className, children }: ChunkedDownloadButtonProps) {
    const [progress, setProgress] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (progress !== null && progress < 100) return // already downloading

        setError(null)
        setProgress(0)

        try {
            // 1. Get file size
            const headRes = await fetch(url, { method: 'HEAD' })
            if (!headRes.ok) {
                throw new Error('파일을 찾을 수 없습니다.')
            }

            const totalSize = parseInt(headRes.headers.get('content-length') || '0', 10)

            if (totalSize === 0) {
                // Fallback: direct download for unknown size
                window.location.href = url
                setProgress(null)
                return
            }

            // Small files (< 5MB): direct download
            if (totalSize < 5 * 1024 * 1024) {
                window.location.href = url
                setProgress(null)
                return
            }

            // 2. Download in chunks
            const chunks: ArrayBuffer[] = []
            let downloaded = 0

            while (downloaded < totalSize) {
                const end = Math.min(downloaded + CHUNK_SIZE - 1, totalSize - 1)

                const res = await fetch(url, {
                    headers: { 'Range': `bytes=${downloaded}-${end}` },
                })

                if (!res.ok && res.status !== 206) {
                    throw new Error(`다운로드 실패 (${res.status})`)
                }

                const chunk = await res.arrayBuffer()
                chunks.push(chunk)
                downloaded = end + 1
                setProgress(Math.round((downloaded / totalSize) * 100))
            }

            // 3. Assemble and trigger download
            const blob = new Blob(chunks)
            const blobUrl = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(blobUrl)

            setProgress(100)
            setTimeout(() => setProgress(null), 2000)
        } catch (err) {
            console.error('Chunked download error:', err)
            setError(err instanceof Error ? err.message : '다운로드 실패')
            setTimeout(() => {
                setError(null)
                setProgress(null)
            }, 3000)
        }
    }

    const isDownloading = progress !== null && progress < 100
    const isDone = progress === 100

    if (className) {
        // Used as inline button (e.g., in attachment lists)
        return (
            <button onClick={handleDownload} className={className} disabled={isDownloading} title={isDownloading ? `${progress}%` : '다운로드'}>
                {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : isDone ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                ) : error ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                    children || <Download className="w-4 h-4" />
                )}
            </button>
        )
    }

    // Used as a full card/link replacement
    return (
        <button onClick={handleDownload} disabled={isDownloading} className="w-full text-left">
            {children}
            {isDownloading && (
                <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </button>
    )
}
