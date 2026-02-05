import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock categories data for now
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
