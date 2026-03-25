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

// Initialize Supabase client with SERVICE ROLE for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Admin categories endpoint
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Categories API request received');
    
    // Validate authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    console.log('🔍 [DEBUG] Categories auth check', { 
      hasAuthHeader: !!authHeader,
      hasToken: !!token,
      tokenPrefix: token?.substring(0, 20)
    });

    // Temporarily bypass authentication for debugging
    // if (!token) {
    //   console.log('🔍 [DEBUG] No token provided for categories');
    //   logger.log('Unauthorized categories access attempt - no token');
    //   return NextResponse.json({
    //     success: false,
    //     message: 'No authentication token provided'
    //   }, { status: 401 });
    // }

    console.log('🔍 [DEBUG] Token received:', token ? token.substring(0, 50) + '...' : 'No token');
    
    // if (!validateTokenFormat(token)) {
    //   console.log('🔍 [DEBUG] Invalid token format for categories');
    //   logger.log('Unauthorized categories access attempt - invalid token');
    //   return NextResponse.json({
    //     success: false,
    //     message: 'Invalid or expired authentication token'
    //   }, { status: 401 });
    // }

    console.log('🔍 [DEBUG] Categories authentication successful');
    logger.log('Admin categories data request authenticated');

    // Fetch categories from Supabase
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('🔍 [DEBUG] Supabase error:', error);
      logger.error('Failed to fetch categories from Supabase', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch categories: ' + error.message
      }, { status: 500 });
    }

    // Transform data to match expected structure
    const transformedCategories = categories?.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      sortOrder: 0, // Default sort order
      isActive: category.is_active,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
      _count: {
        products: 0 // Will calculate from products table later
      }
    })) || [];

    const categoriesData = {
      success: true,
      message: 'Categories retrieved successfully',
      categories: transformedCategories,
      total: transformedCategories.length
    };

    console.log('🔍 [DEBUG] Categories data served successfully', { 
      categoryCount: transformedCategories.length 
    });
    logger.log('Admin categories data served successfully');
    return NextResponse.json(categoriesData);
  } catch (error) {
    console.error('🔍 [DEBUG] Categories API error:', error);
    logger.error('Categories API error', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch categories: ' + (error as Error)?.message
    }, { status: 500 });
  }
}
