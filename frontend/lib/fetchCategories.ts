import { supabase } from '../lib/supabase-client'

export async function fetchCategories() {
  const supabaseClient = supabase()
  if (!supabaseClient) {
    console.error('Supabase client not available')
    return []
  }

  const { data, error } = await supabaseClient
    .from('categories')
    .select('id, name, image_url, created_at, product_count')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      status: error.status
    })
    return []
  }

  return data || []
}
