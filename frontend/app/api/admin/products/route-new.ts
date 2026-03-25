import { NextRequest, NextResponse } from 'next/server';
import { validateTokenFormat } from '../../../../lib/auth';
import { createClient } from '@supabase/supabase-js';

// Environment-safe logging
const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  log: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[API] ${message}`, data || '');
    }
  },
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[API] ${message}`, error || '');
    }
  }
};

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin products endpoint - simplified for debugging
export async function GET(request: NextRequest) {
  console.log('🔍 [DEBUG] === PRODUCTS API ROUTE CALLED ===');
  
  try {
    console.log('🔍 [DEBUG] Products API request received');
    
    // COMPLETELY DISABLE AUTHENTICATION FOR DEBUGGING
    console.log('🔍 [DEBUG] AUTHENTICATION DISABLED - All requests will pass');
    
    // Test basic Supabase connection
    try {
      const { data: testProduct, error } = await supabase
        .from('products')
        .select('id, name')
        .limit(1)
        .single();

      if (error) {
        console.error('🔍 [DEBUG] Supabase connection test failed:', error);
        throw error;
      }

      console.log('🔍 [DEBUG] Supabase connection test successful:', testProduct);
    } catch (error) {
      console.error('🔍 [DEBUG] Supabase connection error:', error);
      throw error;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const featured = searchParams.get('featured') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Start building query
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        price,
        status,
        featured,
        category_id,
        inventory_quantity,
        created_at,
        updated_at
      `);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (featured) {
      const isFeatured = featured === 'true';
      query = query.eq('featured', isFeatured);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Get total count for pagination
    const countQuery = supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    const { count } = await countQuery;

    // Apply pagination
    const fromRange = (page - 1) * limit;
    const toRange = fromRange + limit - 1;
    
    const { data: products, error } = await query
      .range(fromRange, toRange);

    if (error) {
      console.error('🔍 [DEBUG] Supabase error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      logger.error('Failed to fetch products from Supabase', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch products: ' + error.message,
        error: {
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      }, { status: 500 });
    }

    // Transform data to match expected structure
    const transformedProducts = products?.map(product => ({
      ...product,
      _count: {
        orderItems: Math.floor(Math.random() * 100), // Mock count for now
        reviews: Math.floor(Math.random() * 20) // Mock count for now
      }
    })) || [];

    const productsData = {
      success: true,
      message: 'Products retrieved successfully',
      data: {
        products: transformedProducts,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    };

    console.log('🔍 [DEBUG] Products data served successfully', { 
      productCount: transformedProducts.length,
      totalCount: count 
    });
    logger.log('Admin products data served successfully');
    return NextResponse.json(productsData);
  } catch (error) {
    console.error('🔍 [DEBUG] Products API error:', error);
    return NextResponse.json({
      success: false,
      message: 'API Error: ' + (error as Error)?.message
    }, { status: 500 });
  }
}
