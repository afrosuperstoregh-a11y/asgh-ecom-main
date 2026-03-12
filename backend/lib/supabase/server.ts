import { createClient } from '@supabase/supabase-js'
import { Database } from '../../types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// Singleton Supabase client for server-side operations
let supabaseServer: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseServer() {
  if (!supabaseServer) {
    supabaseServer = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabaseServer
}

// Test connection
export async function testSupabaseConnection() {
  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error) {
      console.error('❌ Supabase connection failed:', error)
      return false
    }
    
    console.log('✅ Supabase connected successfully')
    return true
  } catch (error) {
    console.error('❌ Supabase connection error:', error)
    return false
  }
}

export { getSupabaseServer as supabase }
