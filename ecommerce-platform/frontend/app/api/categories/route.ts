import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: NextRequest) {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        *,
        products!inner(count)
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch categories'
      }, { status: 500 });
    }

    // Transform data to include product count
    const transformedCategories = categories?.map(cat => ({
      ...cat,
      product_count: cat.products?.length || 0,
      products: undefined // Remove the nested products array
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedCategories,
      count: transformedCategories.length
    });
  } catch (error) {
    console.error('Error in categories API:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
