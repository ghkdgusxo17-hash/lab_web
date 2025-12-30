/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React Strict Mode for development
    reactStrictMode: true,
    // Increase body size limit for server actions (default is 1MB)
    experimental: {
        serverActions: {
            bodySizeLimit: '30mb',
        },
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
