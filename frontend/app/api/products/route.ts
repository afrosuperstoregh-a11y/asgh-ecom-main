import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration - use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client
const createSupabaseClient = () => {
  if (supabaseUrl && supabaseKey) {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return null;
};

console.log('🔍 [API] API route called, starting execution...');
    
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API] Fetching products...');
    
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

    // Get data from Supabase
    const supabase = createSupabaseClient();
    
    if (!supabase) {
      console.error('Supabase client not configured');
      return NextResponse.json({
        success: false,
        message: 'Database not configured'
      }, { status: 500 });
    }

    console.log('🔍 [API] Initial query setup:', { sort, order });
    
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    console.log('🔍 [API] Query built with status filter');

    // Add category filter
    if (category && category !== 'all') {
      console.log('🔍 [API] Applying category filter:', category);
      // First get category ID from slug
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single();
      
      if (categoryData) {
        query = query.eq('category_id', categoryData.id);
        console.log('🔍 [API] Category filter applied:', category, '→', categoryData.id);
      }
    }

    // Add search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Add ordering
    query = query.order(sort, { ascending: order === 'ASC' });

    // Add pagination only if limit is specified
    if (shouldLimit && limit) {
      query = query.range(offset || 0, (offset || 0) + limit - 1);
    }

    console.log('🔍 [API] Query params:', { category, search, shouldLimit, limit, offset });
    
    const { data: products, error, count } = await query;

    console.log('🔍 [API] Query result:', { 
      productsLength: products?.length || 0, 
      error: error?.message, 
      count: count,
      products: products?.slice(0, 2) // Show first 2 products for debugging
    });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({
        success: false,
        message: 'Database query failed',
        error: error.message
      }, { status: 500 });
    }

    // Get unique categories for filter dropdown
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('slug')
      .eq('is_active', true);

    const uniqueCategories = [...new Set(categoriesData?.map(c => c.slug) || [])];

    if (!products || products.length === 0) {
      return NextResponse.json({
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
      });
    }

    const totalItems = count || 0;
    const totalPages = shouldLimit && limit ? Math.ceil(totalItems / limit) : 1;
    const itemsPerPage = shouldLimit ? limit : totalItems;

    console.log(`✅ [API] Found ${products.length} products`);

    return NextResponse.json({
      success: true,
      data: {
        products,
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
    });

  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
