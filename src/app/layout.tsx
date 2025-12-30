import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
    title: '화학공정연구실 | CPE Lab',
    description: '공정 시스템 최적화, 반응공학, 분리공정 연구를 통해 지속가능한 화학공정 기술을 개발합니다.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ko" className={inter.variable} suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                const stored = localStorage.getItem('theme');
                                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                                const theme = stored === 'dark' || (!stored && systemDark) || (stored === 'system' && systemDark) ? 'dark' : 'light';
                                document.documentElement.classList.add(theme);
                            })();
                        `,
                    }}
                />
            </head>
            <body className="font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-x-hidden" suppressHydrationWarning>
                {/* Global Background Elements */}
                <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
                    <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
                    <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]" />
                </div>

                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}
