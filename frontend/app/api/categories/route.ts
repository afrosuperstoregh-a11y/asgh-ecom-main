import { createClient } from '@supabase/supabase-js'

// Mock categories for fallback when database is not available
function getMockCategories() {
  return [
    {
      id: '1',
      name: 'Women Fashion',
      image_url: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/women.png',
      created_at: new Date().toISOString(),
      is_active: true,
      sort_order: 1,
      product_count: 15
    },
    {
      id: '2', 
      name: 'Men Fashion',
      image_url: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/men.png',
      created_at: new Date().toISOString(),
      is_active: true,
      sort_order: 2,
      product_count: 12
    },
    {
      id: '3',
      name: 'Beauty & Health',
      image_url: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/beauty.png',
      created_at: new Date().toISOString(),
      is_active: true,
      sort_order: 3,
      product_count: 8
    },
    {
      id: '4',
      name: 'Clothing',
      image_url: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/clothing.jpg',
      created_at: new Date().toISOString(),
      is_active: true,
      sort_order: 4,
      product_count: 10
    },
    {
      id: '5',
      name: 'Electronics',
      image_url: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/electronics.png',
      created_at: new Date().toISOString(),
      is_active: true,
      sort_order: 5,
      product_count: 6
    },
    {
      id: '6',
      name: 'Home & Living',
      image_url: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/home-decor.jpg',
      created_at: new Date().toISOString(),
      is_active: true,
      sort_order: 6,
      product_count: 7
    },
    {
      id: '7',
      name: 'Food & Beverages',
      image_url: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/food.png',
      created_at: new Date().toISOString(),
      is_active: true,
      sort_order: 7,
      product_count: 5
    },
    {
      id: '8',
      name: 'Accessories',
      image_url: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/accessories.jpg',
      created_at: new Date().toISOString(),
      is_active: true,
      sort_order: 8,
      product_count: 9
    },
    {
      id: '9',
      name: 'Sport Fitness',
      image_url: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/sports.png',
      created_at: new Date().toISOString(),
      is_active: true,
      sort_order: 9,
      product_count: 4
    },
    {
      id: '10',
      name: 'Books Media',
      image_url: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/books.png',
      created_at: new Date().toISOString(),
      is_active: true,
      sort_order: 10,
      product_count: 3
    },
    {
      id: '11',
      name: 'Art & Crafts',
      image_url: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/Jewelry.png',
      created_at: new Date().toISOString(),
      is_active: true,
      sort_order: 11,
      product_count: 2
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
      return new Response(JSON.stringify({ 
        success: true,
        data: getMockCategories(),
        count: 11
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Test database connection
    let databaseAvailable = false;
    try {
      const { data: testConnection, error: connectionError } = await supabase
        .from('categories')
        .select('id')
        .limit(1)
      
      if (connectionError) {
        console.error('Database connection error:', connectionError)
        databaseAvailable = false;
      } else {
        databaseAvailable = true;
      }
    } catch (connectionTestError) {
      console.error('Database test failed:', connectionTestError)
      databaseAvailable = false;
    }

    // If database is not available, fallback to mock categories
    if (!databaseAvailable) {
      console.log('Database unavailable, using mock categories');
      return new Response(JSON.stringify({ 
        success: true,
        data: getMockCategories(),
        count: 3
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, image_url, created_at, is_active, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Supabase fetch error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      // Fallback to mock categories
      return new Response(JSON.stringify({ 
        success: true,
        data: getMockCategories(),
        count: 3
      }), { 
        status: 200,
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
          if (imageUrl && typeof imageUrl === 'string') {
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
    
    // Always return mock data instead of failing
    return new Response(JSON.stringify({ 
      success: true,
      data: getMockCategories(),
      count: 3
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
