'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'
type DesignTheme = 'soft' | 'sharp'

interface ThemeContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
    resolvedTheme: 'light' | 'dark'
    designTheme: DesignTheme
    setDesignTheme: (theme: DesignTheme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system')
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
    const [designTheme, setDesignThemeState] = useState<DesignTheme>('soft')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const storedTheme = localStorage.getItem('theme') as Theme | null
        const storedDesignTheme = localStorage.getItem('designTheme') as DesignTheme | null
        if (storedTheme) {
            setThemeState(storedTheme)
        }
        if (storedDesignTheme) {
            setDesignThemeState(storedDesignTheme)
        }
    }, [])

    useEffect(() => {
        if (!mounted) return

        const root = document.documentElement
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

        function applyTheme(themeValue: Theme) {
            let resolved: 'light' | 'dark'
            if (themeValue === 'system') {
                resolved = systemDark.matches ? 'dark' : 'light'
            } else {
                resolved = themeValue
            }
            setResolvedTheme(resolved)
            root.classList.remove('light', 'dark')
            root.classList.add(resolved)
        }

        applyTheme(theme)

        // Listen for system theme changes
        function handleSystemChange() {
            if (theme === 'system') {
                applyTheme('system')
            }
        }

        systemDark.addEventListener('change', handleSystemChange)
        return () => systemDark.removeEventListener('change', handleSystemChange)
    }, [theme, mounted])

    // Apply design theme
    useEffect(() => {
        if (!mounted) return

        const root = document.documentElement
        root.classList.remove('theme-soft', 'theme-sharp')
        if (designTheme === 'sharp') {
            root.classList.add('theme-sharp')
        }
    }, [designTheme, mounted])

    function setTheme(newTheme: Theme) {
        setThemeState(newTheme)
        localStorage.setItem('theme', newTheme)
    }

    function setDesignTheme(newDesignTheme: DesignTheme) {
        setDesignThemeState(newDesignTheme)
        localStorage.setItem('designTheme', newDesignTheme)
    }

    // Prevent flash
    if (!mounted) {
        return (
            <script
                dangerouslySetInnerHTML={{
                    __html: `
                        (function() {
                            const stored = localStorage.getItem('theme');
                            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                            const theme = stored === 'dark' || (!stored && systemDark) || (stored === 'system' && systemDark) ? 'dark' : 'light';
                            document.documentElement.classList.add(theme);
                            
                            const designTheme = localStorage.getItem('designTheme');
                            if (designTheme === 'sharp') {
                                document.documentElement.classList.add('theme-sharp');
                            }
                        })();
                    `,
                }}
            />
        )
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, designTheme, setDesignTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider')
    }
    return context
}
