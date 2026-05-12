/** @type {import('next').NextConfig} */
const ONLYOFFICE_PROXY_TARGET = process.env.ONLYOFFICE_PROXY_TARGET || 'http://127.0.0.1:9892'

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
    async rewrites() {
        return [
            {
                source: '/onlyoffice',
                destination: `${ONLYOFFICE_PROXY_TARGET}/`,
            },
            {
                source: '/onlyoffice/:path*',
                destination: `${ONLYOFFICE_PROXY_TARGET}/:path*`,
            },
            {
                source: '/web-apps/:path*',
                destination: `${ONLYOFFICE_PROXY_TARGET}/web-apps/:path*`,
            },
            {
                source: '/sdkjs/:path*',
                destination: `${ONLYOFFICE_PROXY_TARGET}/sdkjs/:path*`,
            },
            {
                source: '/cache/:path*',
                destination: `${ONLYOFFICE_PROXY_TARGET}/cache/:path*`,
            },
            {
                source: '/fonts/:path*',
                destination: `${ONLYOFFICE_PROXY_TARGET}/fonts/:path*`,
            },
            {
                source: '/dictionaries/:path*',
                destination: `${ONLYOFFICE_PROXY_TARGET}/dictionaries/:path*`,
            },
            {
                source: '/plugins/:path*',
                destination: `${ONLYOFFICE_PROXY_TARGET}/plugins/:path*`,
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
