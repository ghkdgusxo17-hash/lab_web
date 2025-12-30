// Simple in-memory rate limiter
// For production, consider using Redis or a dedicated rate limiting service

interface RateLimitEntry {
    count: number
    resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key)
        }
    }
}, 5 * 60 * 1000)

interface RateLimitOptions {
    maxRequests: number  // Max requests per window
    windowMs: number     // Window size in milliseconds
}

const DEFAULT_OPTIONS: RateLimitOptions = {
    maxRequests: 10,
    windowMs: 60 * 1000  // 1 minute
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address, user ID, form name + IP)
 * @param options - Rate limit options
 * @returns true if rate limited (should block), false if allowed
 */
export function isRateLimited(
    identifier: string,
    options: Partial<RateLimitOptions> = {}
): boolean {
    const { maxRequests, windowMs } = { ...DEFAULT_OPTIONS, ...options }
    const now = Date.now()
    const entry = rateLimitStore.get(identifier)

    if (!entry || entry.resetTime < now) {
        // Create new entry
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + windowMs
        })
        return false
    }

    entry.count++

    if (entry.count > maxRequests) {
        return true // Rate limited
    }

    return false
}

/**
 * Get remaining requests for an identifier
 */
export function getRemainingRequests(
    identifier: string,
    maxRequests: number = DEFAULT_OPTIONS.maxRequests
): number {
    const entry = rateLimitStore.get(identifier)
    if (!entry || entry.resetTime < Date.now()) {
        return maxRequests
    }
    return Math.max(0, maxRequests - entry.count)
}

// Preset rate limiters for common use cases
export const rateLimiters = {
    // Contact form: 3 submissions per minute
    contactForm: (ip: string) => isRateLimited(`contact:${ip}`, { maxRequests: 3, windowMs: 60 * 1000 }),

    // Login attempts: 5 per minute
    login: (ip: string) => isRateLimited(`login:${ip}`, { maxRequests: 5, windowMs: 60 * 1000 }),

    // Publication bulk import: 2 per minute
    bulkImport: (userId: string) => isRateLimited(`bulk:${userId}`, { maxRequests: 2, windowMs: 60 * 1000 }),

    // General API: 60 requests per minute
    api: (ip: string) => isRateLimited(`api:${ip}`, { maxRequests: 60, windowMs: 60 * 1000 }),
}
