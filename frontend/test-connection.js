import { supabase } from './lib/supabase-client'

// Simple test to verify Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase client initialized:', !!supabase)
    
    // Test basic connection
    const { data, error } = await supabase.from('products').select('count').single()
    
    if (error) {
      console.error('Supabase connection error:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
    } else {
      console.log('Supabase connection successful!')
      console.log('Data:', data)
    }
    
    // Test categories
    const { data: categories, error: catError } = await supabase.from('categories').select('*').limit(5)
    
    if (catError) {
      console.error('Categories error:', catError)
    } else {
      console.log('Categories found:', categories?.length || 0)
    }
    
  } catch (err) {
    console.error('Test failed:', err)
  }
}

// Run the test
testSupabaseConnection()
