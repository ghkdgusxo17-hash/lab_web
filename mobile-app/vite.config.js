import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
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
                        src: 'favicon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}']
            }
        })
    ],
    server: {
        port: 5173,
        host: true
    }
});
