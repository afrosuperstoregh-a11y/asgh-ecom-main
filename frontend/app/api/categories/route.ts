import { supabase } from '../../../lib/supabase-server'

export async function GET() {
  try {
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, image_url, created_at, is_active, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Supabase fetch error:', error)
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get product counts for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category: any) => {
        try {
          if (!supabase) {
            return {
              ...category,
              product_count: 0
            };
          }
          
          const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'active');

          if (countError) {
            console.warn('Error getting product count for category', category.id, countError);
          }

          return {
            ...category,
            product_count: count || 0
          };
        } catch (error) {
          console.warn('Error getting product count for category', category.id, error);
          return {
            ...category,
            product_count: 0
          };
        }
      })
    );

    return new Response(JSON.stringify({ 
      success: true,
      data: categoriesWithCounts,
      count: categoriesWithCounts.length
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (err) {
    console.error('Categories API error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
