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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Try to get data from Supabase first
    const supabase = createSupabaseClient();
    
    if (supabase) {
      try {
        const { data: product, error } = await supabase
          .from('products')
          .select(`
            *,
            categories!inner(name, slug)
          `)
          .or(`id.eq.${id},slug.eq.${id}`)
          .eq('status', 'active')
          .single();
        
        if (!error && product) {
          return NextResponse.json({
            success: true,
            data: product
          });
        }
      } catch (supabaseError) {
        console.warn('Supabase query failed, falling back to mock data:', supabaseError);
      }
    }

    // Fallback to mock data if Supabase fails or isn't configured
    console.log('Using mock data for product:', id);
    
    // Mock product data
    const mockProducts: Record<string, any> = {
      "girls-dashiki": {
        id: "1",
        name: "Girls Dashiki",
        slug: "girls-dashiki",
        description: "Latest style ladies Dashiki dress made with premium fabric and traditional African patterns. Perfect for special occasions and cultural events.",
        short_description: "Latest style ladies Dashiki dress.",
        sku: "100206",
        price: 30.00,
        compare_price: null,
        cost_price: null,
        weight: null,
        dimensions: null,
        category_id: "1",
        vendor_id: null,
        images: ["/placeholder-product.jpg"],
        tags: ["dashiki", "women", "traditional", "african"],
        inventory_quantity: 50,
        track_inventory: true,
        allow_backorder: false,
        requires_shipping: true,
        is_digital: false,
        status: "active",
        featured: false,
        seo_title: null,
        seo_description: null,
        created_at: "2026-02-05T06:58:52.481147+00:00",
        updated_at: "2026-02-05T06:58:52.481147+00:00",
        created_by: null,
        categories: {
          "name": "Women Fashion",
          "slug": "women-fashion"
        }
      },
      "boys-dashiki": {
        id: "2",
        name: "Boys Dashiki",
        slug: "boys-dashiki",
        description: "Latest style boys Dashiki dress made with premium fabric and traditional African patterns. Perfect for special occasions and cultural events.",
        short_description: "Latest style boys Dashiki dress.",
        sku: "100207",
        price: 30.00,
        compare_price: null,
        cost_price: null,
        weight: null,
        dimensions: null,
        category_id: "2",
        vendor_id: null,
        images: ["/placeholder-product.jpg"],
        tags: ["dashiki", "men", "traditional", "african"],
        inventory_quantity: 50,
        track_inventory: true,
        allow_backorder: false,
        requires_shipping: true,
        is_digital: false,
        status: "active",
        featured: false,
        seo_title: null,
        seo_description: null,
        created_at: "2026-02-05T06:58:52.578369+00:00",
        updated_at: "2026-02-05T06:58:52.578369+00:00",
        created_by: null,
        categories: {
          "name": "Men Fashion",
          "slug": "men-fashion"
        }
      },
      "banku-flour": {
        id: "3",
        name: "Banku Flour",
        slug: "banku-flour",
        description: "Premium quality fermented banku flour made from maize and cassava. Perfect for preparing traditional Ghanaian banku. Made with authentic ingredients and traditional fermentation methods.",
        short_description: "Premium quality fermented banku flour.",
        sku: "100201",
        price: 50.00,
        compare_price: null,
        cost_price: null,
        weight: null,
        dimensions: null,
        category_id: "3",
        vendor_id: null,
        images: ["/placeholder-product.jpg"],
        tags: ["banku", "flour", "fermented", "ghanaian", "food"],
        inventory_quantity: 100,
        track_inventory: true,
        allow_backorder: false,
        requires_shipping: true,
        is_digital: false,
        status: "active",
        featured: false,
        seo_title: null,
        seo_description: null,
        created_at: "2026-02-05T06:58:52.630232+00:00",
        updated_at: "2026-02-05T06:58:52.630232+00:00",
        created_by: null,
        categories: {
          "name": "Food",
          "slug": "food"
        }
      }
    };

    const product = mockProducts[id] || mockProducts[`1`]; // Fallback to first product
    
    if (!product) {
      return NextResponse.json({
        success: false,
        message: 'Product not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch product'
    }, { status: 500 });
  }
}
