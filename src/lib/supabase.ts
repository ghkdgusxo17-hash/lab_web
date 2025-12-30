import 'server-only'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Server-side Supabase client with service role key (for file uploads)
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    // Return a dummy object or null that throws when accessed to delay error
    : createClient('https://placeholder.supabase.co', 'placeholder', { auth: { persistSession: false } }) // Fallback to avoid module crash



