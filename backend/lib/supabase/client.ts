import { createClient } from '@supabase/supabase-js'

// Singleton Supabase client for backend operations
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not configured in environment variables')
    }

    if (!supabaseAnonKey) {
      throw new Error('SUPABASE_ANON_KEY is not configured in environment variables')
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  }
  return supabaseClient
}

export { getSupabaseClient as supabase }
