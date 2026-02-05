import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For now, return mock data to ensure the API works
    // We can integrate Supabase once the basic structure is working
    const mockProducts = [
      {
        id: "1",
        name: "Girls Dashiki",
        slug: "girls-dashiki",
        description: "Latest style ladies Dashiki dress made with premium fabric and traditional African patterns.",
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
      {
        id: "2",
        name: "Boys Dashiki",
        slug: "boys-dashiki",
        description: "Latest style boys Dashiki dress made with premium fabric and traditional African patterns.",
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
      {
        id: "3",
        name: "Banku Flour",
        slug: "banku-flour",
        description: "Premium quality fermented banku flour made from maize and cassava. Perfect for preparing traditional Ghanaian banku.",
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
    ];

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let filteredProducts = mockProducts;

    // Filter by category
    if (category && category !== 'all-products') {
      filteredProducts = filteredProducts.filter(product => 
        product.categories.slug === category || product.categories.name === category
      );
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const offset = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(filteredProducts.length / limit),
        total_items: filteredProducts.length,
        items_per_page: limit,
        has_next: page < Math.ceil(filteredProducts.length / limit),
        has_prev: page > 1
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
