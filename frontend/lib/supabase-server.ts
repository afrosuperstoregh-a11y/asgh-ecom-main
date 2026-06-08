import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function getSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY')
  }

  const cookieStore = await cookies()
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Export a function for backward compatibility
export const supabase = getSupabaseServer

// Alias for backward compatibility
export const getSupabaseAdmin = getSupabaseServer

export default getSupabaseServer
