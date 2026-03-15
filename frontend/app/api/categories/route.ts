import { createClient } from '@supabase/supabase-js'

// Mock categories for fallback when database is not available
function getMockCategories() {
  return [
    {
      id: '1',
      name: 'Women Fashion',
      image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25343c?w=400&h=300&fit=crop',
      created_at: new Date().toISOString(),
      is_active: true,
      sort_order: 1,
      product_count: 15
    },
    {
      id: '2', 
      name: 'Men Fashion',
      image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
      created_at: new Date().toISOString(),
      is_active: true,
      sort_order: 2,
      product_count: 12
    },
    {
      id: '3',
      name: 'Food',
      image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      created_at: new Date().toISOString(),
      is_active: true,
      sort_order: 3,
      product_count: 8
    }
  ]
}

export async function GET() {
  try {
    // Create Supabase client inside the function to avoid build-time issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing required environment variables for categories API')
      
      // Return mock categories in production if environment is not configured
      if (process.env.NODE_ENV === 'production') {
        return new Response(JSON.stringify({ 
          success: true,
          data: getMockCategories(),
          count: 3
        }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ error: 'Database not configured' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, image_url, created_at, is_active, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Supabase fetch error:', error)
      
      // In production, return mock data instead of failing
      if (process.env.NODE_ENV === 'production') {
        return new Response(JSON.stringify({ 
          success: true,
          data: getMockCategories(),
          count: 3
        }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
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
    
    // In production, always return mock data instead of failing
    if (process.env.NODE_ENV === 'production') {
      return new Response(JSON.stringify({ 
        success: true,
        data: getMockCategories(),
        count: 3
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
