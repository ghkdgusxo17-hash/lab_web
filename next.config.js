/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React Strict Mode for development
    reactStrictMode: true,
    // Increase body size limit for server actions (100MB - Cloudflare 무료 플랜 제한)
    experimental: {
        serverActions: {
            bodySizeLimit: '100mb',
        },
    },
    async headers() {
        return [
            {
                source: '/uploads/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET' },
                ],
            },
        ]
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
    },
}

module.exports = nextConfig
