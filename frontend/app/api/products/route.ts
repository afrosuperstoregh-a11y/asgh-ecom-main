import { createClient } from '@supabase/supabase-js'

// Create Supabase client for API routes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: Request) {
  try {
    // Log environment variables for debugging (without exposing sensitive data)
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10) + '...'
    });

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing required environment variables');
      return new Response(JSON.stringify({ 
        error: 'Database not configured - missing environment variables',
        details: 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'
      }), { 
        status: 500,
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
        images: images.length > 0 ? images : ['/placeholder-product.jpg']
      };
    });

    // Get unique categories for filter dropdown
    const { data: categoriesData } = await supabaseAdmin
      .from('categories')
      .select('slug')
      .eq('is_active', true);

    const uniqueCategories = [...new Set(categoriesData?.map((c: any) => c.slug) || [])];

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
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
