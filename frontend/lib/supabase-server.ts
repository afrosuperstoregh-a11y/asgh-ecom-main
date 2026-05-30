import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

let supabaseServer: ReturnType<typeof createClient> | null = null

export async function getSupabaseServer() {
  if (supabaseServer) {
    return supabaseServer
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
  }

  const cookieStore = await cookies()
  
  supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  return supabaseServer
}

// Export a function for backward compatibility
export const supabase = getSupabaseServer

// Export the client directly for cases where it's needed
export { supabaseServer as supabaseInstance }

// Alias for backward compatibility
export const getSupabaseAdmin = getSupabaseServer

export default getSupabaseServer
