import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon-192.png', 'icon-512.png'],
            manifest: {
                name: 'Lab Recorder - 발표 녹음 & AI 요약',
                short_name: 'Lab Recorder',
                description: '랩미팅 발표를 녹음하고 AI로 요약합니다',
                theme_color: '#4a9eff',
                background_color: '#f5f7fa',
                display: 'standalone',
                orientation: 'portrait',
                icons: [
                    {
                        src: 'icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                skipWaiting: true,
                clientsClaim: true
            }
        })
    ],
    server: {
        port: 5173,
        host: true
    }
});
