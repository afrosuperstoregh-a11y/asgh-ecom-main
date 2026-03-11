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

    // Get product counts for each category and process image URLs
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

          // Process image URL for production
          let imageUrl = category.image_url;
          if (imageUrl) {
            // If it's already a full URL, return as is
            if (!imageUrl.startsWith('http')) {
              // If it's a Supabase storage path, construct full URL
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
              if (supabaseUrl && (imageUrl.startsWith('category-images/') || imageUrl.startsWith('/'))) {
                const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
                imageUrl = `${supabaseUrl}/storage/v1/object/public/categories/${cleanPath}`;
              }
            }
          } else {
            imageUrl = '/placeholder-category.svg';
          }

          return {
            ...category,
            image_url: imageUrl,
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
