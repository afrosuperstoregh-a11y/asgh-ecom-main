import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API] Categories API called');
    console.log('🔍 [API] Environment variables:', {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
    });
    
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
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/women.png",
          parent_id: null,
          sort_order: 1,
          is_active: true,
          product_count: 45,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "2", 
          name: "Men Fashion",
          slug: "men-fashion",
          description: "Latest men's fashion and clothing",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/men.png",
          parent_id: null,
          sort_order: 2,
          is_active: true,
          product_count: 38,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "3",
          name: "Food",
          slug: "food", 
          description: "Authentic African food products",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/food.png",
          parent_id: null,
          sort_order: 3,
          is_active: true,
          product_count: 52,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "4",
          name: "Electronics",
          slug: "electronics",
          description: "Latest gadgets and tech accessories",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/electronics.png",
          parent_id: null,
          sort_order: 4,
          is_active: true,
          product_count: 67,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "5",
          name: "Home & Living",
          slug: "home-living",
          description: "Decor and essentials for your home",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/home.png",
          parent_id: null,
          sort_order: 5,
          is_active: true,
          product_count: 41,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "6",
          name: "Beauty & Health",
          slug: "beauty-health",
          description: "Skincare, makeup and health products",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/beauty.png",
          parent_id: null,
          sort_order: 6,
          is_active: true,
          product_count: 29,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "7",
          name: "Sports & Fitness",
          slug: "sports-fitness",
          description: "Gear for active lifestyles",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/sports.png",
          parent_id: null,
          sort_order: 7,
          is_active: true,
          product_count: 33,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "8",
          name: "Books & Media",
          slug: "books-media",
          description: "Books, music and entertainment",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/books.png",
          parent_id: null,
          sort_order: 8,
          is_active: true,
          product_count: 24,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "9",
          name: "Jewelry & Accessories",
          slug: "jewelry-accessories",
          description: "Fashion jewelry and accessories",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/jewelry.png",
          parent_id: null,
          sort_order: 9,
          is_active: true,
          product_count: 31,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "10",
          name: "Toys & Games",
          slug: "toys-games",
          description: "Toys, games and fun for all ages",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/toys.png",
          parent_id: null,
          sort_order: 10,
          is_active: true,
          product_count: 18,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "11",
          name: "Automotive",
          slug: "automotive",
          description: "Car parts and automotive accessories",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/automotive.png",
          parent_id: null,
          sort_order: 11,
          is_active: true,
          product_count: 22,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "12",
          name: "Baby & Kids",
          slug: "baby-kids",
          description: "Products for babies and children",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/baby.png",
          parent_id: null,
          sort_order: 12,
          is_active: true,
          product_count: 27,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "13",
          name: "Pet Supplies",
          slug: "pet-supplies",
          description: "Everything for your beloved pets",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/pets.png",
          parent_id: null,
          sort_order: 13,
          is_active: true,
          product_count: 19,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "14",
          name: "Office Supplies",
          slug: "office-supplies",
          description: "Office and school supplies",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/office.png",
          parent_id: null,
          sort_order: 14,
          is_active: true,
          product_count: 15,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "15",
          name: "Garden & Outdoor",
          slug: "garden-outdoor",
          description: "Garden tools and outdoor equipment",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/garden.png",
          parent_id: null,
          sort_order: 15,
          is_active: true,
          product_count: 21,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "16",
          name: "Health & Wellness",
          slug: "health-wellness",
          description: "Health supplements and wellness products",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/health.png",
          parent_id: null,
          sort_order: 16,
          is_active: true,
          product_count: 26,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "17",
          name: "Travel & Luggage",
          slug: "travel-luggage",
          description: "Travel accessories and luggage",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/travel.png",
          parent_id: null,
          sort_order: 17,
          is_active: true,
          product_count: 17,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "18",
          name: "Musical Instruments",
          slug: "musical-instruments",
          description: "Musical instruments and equipment",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/music.png",
          parent_id: null,
          sort_order: 18,
          is_active: true,
          product_count: 13,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "19",
          name: "Art & Crafts",
          slug: "art-crafts",
          description: "Art supplies and craft materials",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/art.png",
          parent_id: null,
          sort_order: 19,
          is_active: true,
          product_count: 20,
          created_at: "2026-02-05T06:58:52.000000+00:00",
          updated_at: "2026-02-05T06:58:52.000000+00:00"
        },
        {
          id: "20",
          name: "Fashion Accessories",
          slug: "fashion-accessories",
          description: "Bags, shoes and fashion accessories",
          image_url: "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/accessories.png",
          parent_id: null,
          sort_order: 20,
          is_active: true,
          product_count: 35,
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
