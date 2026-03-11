import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase-client';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API] Categories API called');
    
    // Check if supabase is available
    if (!supabase) {
      console.error('Supabase client not configured');
      return NextResponse.json({
        success: false,
        message: 'Database not configured'
      }, { status: 500 });
    }

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      // Fallback to mock data
      console.log('Using mock data for categories due to error');
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
    }

    if (!categories || categories.length === 0) {
      console.log('No categories found, returning empty array');
      return NextResponse.json({
        success: true,
        data: [],
        count: 0
      });
    }

    // Get product counts for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category: any) => {
        try {
          const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'active');

          if (countError) {
            console.warn('Error getting product count for category', category.id, countError);
          }

          return {
            ...category,
            product_count: count || 0
          };
        } catch (error) {
          console.warn('Error getting product count for category', (category as any).id, error);
          return {
            ...category,
            product_count: 0
          };
        }
      })
    );

    console.log(`✅ [API] Found ${categoriesWithCounts.length} categories`);
    
    return NextResponse.json({
      success: true,
      data: categoriesWithCounts,
      count: categoriesWithCounts.length
    });

  } catch (error) {
    console.error('Error in categories API:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
