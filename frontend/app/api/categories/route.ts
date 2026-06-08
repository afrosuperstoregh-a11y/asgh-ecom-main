import { createClient } from '@supabase/supabase-js'
import { getCategoryImageUrl as getServerCategoryImageUrl } from '../../../lib/server-images'

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Mock categories for fallback when database is not available
function getMockCategories() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  
  const categoryImages = [
    'category-images/women.png',
    'category-images/men.png',
    'category-images/beauty.png',
    'category-images/clothing.jpg',
    'category-images/electronics.png',
    'category-images/home-decor.jpg',
    'category-images/food.png',
    'category-images/accessories.jpg',
    'category-images/sports.png',
    'category-images/books.png',
    'category-images/Jewelry.png'
  ];
  
  const categoryNames = [
    'Women Fashion',
    'Men Fashion',
    'Beauty & Health',
    'Clothing',
    'Electronics',
    'Home & Living',
    'Food & Beverages',
    'Accessories',
    'Sport Fitness',
    'Books Media',
    'Art & Crafts'
  ];
  
  const productCounts = [15, 12, 8, 10, 6, 7, 5, 9, 4, 3, 2];
  
  return categoryNames.map((name, index) => ({
    id: String(index + 1),
    name: name,
    image_url: getServerCategoryImageUrl(supabaseUrl, categoryImages[index]),
    created_at: new Date().toISOString(),
    is_active: true,
    sort_order: index + 1,
    product_count: productCounts[index]
  }));
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

          // Process image URL for production using server-side utility
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
          const imageUrl = getServerCategoryImageUrl(supabaseUrl, category.image_url);

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
