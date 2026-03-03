
// Storage bucket name
export const STORAGE_BUCKET = 'uploads'

// Convert Supabase storage path to proxy URL (accessible through Cloudflare Tunnel)
export function getProxyUrl(filePath: string) {
    return `/api/storage/${STORAGE_BUCKET}/${filePath}`
}

/**
 * Supabase storage URL(로컬/클라우드 모두)을 프록시 URL로 변환
 * Google OAuth 등 외부 이미지는 그대로 반환
 */
export function toProxyImageUrl(url: string | null | undefined): string | null {
    if (!url) return null
    // 이미 프록시 URL
    if (url.startsWith('/api/storage/')) return url
    // Supabase storage URL (로컬 또는 클라우드)
    const match = url.match(/\/storage\/v1\/object\/public\/uploads\/(.+)/)
    if (match) return getProxyUrl(match[1])
    // Google, 기타 외부 URL은 그대로
    return url
}

/**
 * Extract storage file path from either:
 * - Direct Supabase URL: http://127.0.0.1:54321/storage/v1/object/public/uploads/xxx
 * - Proxy URL: /api/storage/uploads/xxx
 * Returns the path after the bucket name (e.g., "materials/file.pdf")
 */
export function extractStoragePath(url: string): string | null {
    // Try proxy URL format first
    const proxyPrefix = `/api/storage/${STORAGE_BUCKET}/`
    if (url.includes(proxyPrefix)) {
        return url.split(proxyPrefix)[1] || null
    }
    // Fall back to direct Supabase URL format
    const directPrefix = `/storage/v1/object/public/${STORAGE_BUCKET}/`
    if (url.includes(directPrefix)) {
        return url.split(directPrefix)[1] || null
    }
    return null
}
