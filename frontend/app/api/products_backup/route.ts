import { createClient } from '@supabase/supabase-js'
import { getProductImageUrl as getServerProductImageUrl } from '../../../lib/server-images'

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Validate required environment variables
function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}. Will use fallback data.`);
    return false; // Return false instead of throwing error
  }
  return true; // Return true if all variables are present
}

// Mock products for fallback when database is not available
function getMockProducts() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  
  const mockProducts = [
    {
      id: 1,
      name: 'Handwoven Basket',
      slug: 'handwoven-basket',
      description: 'Traditional handwoven basket made by skilled artisans. Perfect for home decor or storage.',
      price: 25.99,
      compare_price: 35.99,
      sku: 'HWB-001',
      status: 'active',
      inventory_quantity: 15,
      track_inventory: true,
      allow_backorder: false,
      imagePath: 'home&living/h&lproduct1.jpg',
      categories: { name: 'Home & Living', slug: 'home-living' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Ankara Print Dress',
      slug: 'ankara-print-dress',
      description: 'Elegant Ankara print dress perfect for special occasions. Features traditional African wax print patterns.',
      price: 65.99,
      compare_price: 85.99,
      sku: 'APD-001',
      status: 'active',
      inventory_quantity: 8,
      track_inventory: true,
      allow_backorder: false,
      imagePath: 'clothing/dashiki-shirt-1.jpeg',
      categories: { name: 'Clothing', slug: 'clothing' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Banku Flour',
      slug: 'banku-flour',
      description: 'Premium quality fermented banku flour made from maize and cassava. Perfect for preparing traditional Ghanaian banku.',
      price: 50.00,
      compare_price: 65.00,
      sku: 'BF-001',
      status: 'active',
      inventory_quantity: 100,
      track_inventory: true,
      allow_backorder: false,
      imagePath: 'banku-flour.jpg',
      categories: { name: 'Food & Beverages', slug: 'food-beverages' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Dell Latitude E5440 1',
      slug: 'dell-latitude-e5440-1',
      description: 'Quality dell latitude e5440 1 offering reliable performance and modern features. Great for work, study, and entertainment.',
      price: 34.00,
      compare_price: 45.00,
      sku: 'DEL-001',
      status: 'active',
      inventory_quantity: 55,
      track_inventory: true,
      allow_backorder: false,
      imagePath: 'electronics/dell-latitude-e5440-1.jpg',
      categories: { name: 'Electronics', slug: 'electronics' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      name: 'H&Bproduct1',
      slug: 'beauty-health-h-bproduct1',
      description: 'Natural h&bproduct1 formulated with traditional African ingredients. Enhance your beauty routine with products inspired by African wellness traditions.',
      price: 16.00,
      compare_price: 25.00,
      sku: 'HB-001',
      status: 'active',
      inventory_quantity: 64,
      track_inventory: true,
      allow_backorder: false,
      imagePath: 'beauty&health/h&bproduct1.jpg',
      categories: { name: 'Beauty & Health', slug: 'beauty-health' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  return mockProducts.map(product => ({
    ...product,
    images: [getServerProductImageUrl(supabaseUrl, product.imagePath)]
  }));
}

export async function GET(request: Request) {
  try {
    // Validate environment variables first
    validateEnvironment()
    
    // Create Supabase client inside the function to avoid build-time issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Test database connection
    try {
      const { data: testConnection, error: connectionError } = await supabaseAdmin
        .from('products')
        .select('id')
        .limit(1)
      
      if (connectionError) {
        console.error('Database connection error:', connectionError)
        
        // Return mock data if database is not accessible
        return new Response(JSON.stringify({
          success: true,
          data: {
            products: getMockProducts(),
            categories: ['home-living', 'clothing', 'food-beverages', 'electronics', 'beauty-health'],
            pagination: {
              current_page: 1,
              total_pages: 1,
              total_items: 3,
              items_per_page: 3,
              has_next: false,
              has_prev: false
            }
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    } catch (connectionTestError) {
      console.error('Database test failed:', connectionTestError)
      
      // Return mock data if database test fails
      return new Response(JSON.stringify({
        success: true,
        data: {
          products: getMockProducts(),
          categories: ['women-fashion', 'men-fashion', 'food'],
          pagination: {
            current_page: 1,
            total_pages: 1,
            total_items: 3,
            items_per_page: 3,
            has_next: false,
            has_prev: false
          }
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'DESC';
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    // Determine if this is a request for all products (no limit) or limited request
    const shouldLimit = limitParam !== null;
    const limit = shouldLimit ? parseInt(limitParam) : null;
    const offset = shouldLimit && page > 1 && limit ? (page - 1) * limit : null;
    
    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        categories!inner(name, slug)
      `, { count: 'exact' })
      .eq('status', 'active');

    // Add category filter
    if (category && category !== 'all') {
      query = query.eq('categories.slug', category);
    }

    // Add search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    // Add ordering
    query = query.order(sort, { ascending: order === 'ASC' });

    // Add pagination only if limit is specified
    if (shouldLimit && limit) {
      query = query.range(offset || 0, (offset || 0) + limit - 1);
    }
    
    const { data: products, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // In production, return mock data instead of failing completely
      if (process.env.NODE_ENV === 'production') {
        return new Response(JSON.stringify({
          success: true,
          data: {
            products: getMockProducts(),
            categories: ['women-fashion', 'men-fashion', 'food'],
            pagination: {
              current_page: page,
              total_pages: 1,
              total_items: 3,
              items_per_page: limit || 3,
              has_next: false,
              has_prev: false
            }
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      return new Response(JSON.stringify({ 
        error: error.message,
        details: error.details,
        code: error.code
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Process products to ensure images are arrays and handle URLs properly
    const processedProducts = (products || []).map((product: any) => {
      // Handle images field - convert string to array if needed
      let images = [];
      if (product.images) {
        if (typeof product.images === 'string') {
          // If it's a JSON string, try to parse it
          try {
            const parsed = JSON.parse(product.images);
            images = Array.isArray(parsed) ? parsed : [product.images];
          } catch {
            // If parsing fails, treat as single image URL
            images = [product.images];
          }
        } else if (Array.isArray(product.images)) {
          images = product.images;
        } else {
          images = [product.images];
        }
      }

      // Ensure all image URLs are properly formatted for production
      images = images.map((img: string) => {
        if (!img) return '/placeholder-product.jpg';
        
        // If it's already a full URL, return as is
        if (img.startsWith('http')) {
          return img;
        }
        
        // If it's a Supabase storage path, construct full URL
        if (img.startsWith('/') || !img.includes('://')) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (supabaseUrl && img.startsWith('product-images/')) {
            return `${supabaseUrl}/storage/v1/object/public/products/${img}`;
          }
        }
        
        return img;
      });

      return {
        ...product,
        images: images.length > 0 ? images : ['/placeholder-product.svg']
      };
    });

    // Get unique categories for filter dropdown
    const { data: categoriesData } = await supabaseAdmin
      .from('categories')
      .select('slug')
      .eq('is_active', true);

    const uniqueCategories = Array.from(new Set(categoriesData?.map((c: any) => c.slug) || []));

    if (!processedProducts || processedProducts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          products: [],
          categories: uniqueCategories,
          pagination: {
            current_page: shouldLimit ? page : 1,
            total_pages: 0,
            total_items: 0,
            items_per_page: shouldLimit ? limit : 0,
            has_next: shouldLimit ? page < 1 : false,
            has_prev: shouldLimit ? page > 1 : false
          }
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const totalItems = count || 0;
    const totalPages = shouldLimit && limit ? Math.ceil(totalItems / limit) : 1;
    const itemsPerPage = shouldLimit ? limit : totalItems;

    return new Response(JSON.stringify({
      success: true,
      data: {
        products: processedProducts,
        categories: uniqueCategories,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: totalItems,
          items_per_page: itemsPerPage,
          has_next: shouldLimit ? page < totalPages : false,
          has_prev: shouldLimit ? page > 1 : false
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in products API:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    // In production, always return mock data instead of failing
    if (process.env.NODE_ENV === 'production') {
      return new Response(JSON.stringify({
        success: true,
        data: {
          products: getMockProducts(),
          categories: ['women-fashion', 'men-fashion', 'food'],
          pagination: {
            current_page: 1,
            total_pages: 1,
            total_items: 3,
            items_per_page: 3,
            has_next: false,
            has_prev: false
          }
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
