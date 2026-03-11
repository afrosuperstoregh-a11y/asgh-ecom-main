import { supabase } from '../lib/supabase-client'

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, image_url, created_at, product_count')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data || []
}
