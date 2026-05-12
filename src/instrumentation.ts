export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Suppress ECONNRESET/aborted errors from Cloudflare Tunnel dropping connections
        // These are expected and don't affect functionality

        const isConnectionReset = (err: any) => {
            if (err?.code === 'ECONNRESET') return true
            if (err?.digest && err?.message === 'aborted') return true
            const msg = String(err?.message || err || '')
            if (msg.includes('ECONNRESET') || msg === 'aborted') return true
            return false
        }

        // Override console.error to filter out ECONNRESET noise
        const originalConsoleError = console.error
        console.error = (...args: any[]) => {
            for (const arg of args) {
                if (isConnectionReset(arg)) return
                const str = String(arg)
                if (str.includes('ECONNRESET') || str === 'aborted') return
            }
            originalConsoleError.apply(console, args)
        }

        // Override console.warn similarly
        const originalConsoleWarn = console.warn
        console.warn = (...args: any[]) => {
            for (const arg of args) {
                if (isConnectionReset(arg)) return
            }
            originalConsoleWarn.apply(console, args)
        }

        // Catch uncaught exceptions
        process.on('uncaughtException', (err: any) => {
            if (isConnectionReset(err)) return
            originalConsoleError('Uncaught Exception:', err)
        })

        // Catch unhandled rejections
        process.on('unhandledRejection', (reason: any) => {
            if (isConnectionReset(reason)) return
            originalConsoleError('Unhandled Rejection:', reason)
        })
    }
}
