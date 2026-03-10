import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration - use anon key for public read operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client with fallback to mock data
const createSupabaseClient = () => {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return null;
};

export async function GET(request: NextRequest) {
  try {
    // Try to get data from Supabase first
    const supabase = createSupabaseClient();
    
    if (supabase) {
      try {
        const { data: categories, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && categories) {
          // Get product counts for each category
          const categoriesWithCounts = await Promise.all(
            categories.map(async (category) => {
              const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('category_id', category.id)
                .eq('status', 'active');

              return {
                ...category,
                product_count: count || 0
              };
            })
          );

          return NextResponse.json({
            success: true,
            data: categoriesWithCounts,
            count: categoriesWithCounts.length
          });
        }
      } catch (supabaseError) {
        console.warn('Supabase query failed, falling back to mock data:', supabaseError);
      }
    }

    // Fallback to mock data if Supabase fails or isn't configured
    console.log('Using mock data for categories');
    const mockCategories = [
      {
        id: "1",
        name: "Women Fashion",
        slug: "women-fashion",
        description: "Latest women's fashion and clothing",
        image_url: null,
        parent_id: null,
        sort_order: 1,
        is_active: true,
        product_count: 1,
        created_at: "2026-02-05T06:58:52.000000+00:00",
        updated_at: "2026-02-05T06:58:52.000000+00:00"
      },
      {
        id: "2", 
        name: "Men Fashion",
        slug: "men-fashion",
        description: "Latest men's fashion and clothing",
        image_url: null,
        parent_id: null,
        sort_order: 2,
        is_active: true,
        product_count: 1,
        created_at: "2026-02-05T06:58:52.000000+00:00",
        updated_at: "2026-02-05T06:58:52.000000+00:00"
      },
      {
        id: "3",
        name: "Food",
        slug: "food", 
        description: "Authentic African food products",
        image_url: null,
        parent_id: null,
        sort_order: 3,
        is_active: true,
        product_count: 1,
        created_at: "2026-02-05T06:58:52.000000+00:00",
        updated_at: "2026-02-05T06:58:52.000000+00:00"
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockCategories,
      count: mockCategories.length
    });
  } catch (error) {
    console.error('Error in categories API:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
