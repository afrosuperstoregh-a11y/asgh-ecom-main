import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Mock categories data
    const categories = [
      {
        id: 'CAT-001',
        name: 'Clothing',
        slug: 'clothing',
        description: 'Afrocentric clothing and apparel',
        productCount: 45,
        status: 'active'
      },
      {
        id: 'CAT-002',
        name: 'Accessories',
        slug: 'accessories',
        description: 'Fashion accessories and jewelry',
        productCount: 89,
        status: 'active'
      },
      {
        id: 'CAT-003',
        name: 'Home & Living',
        slug: 'home-living',
        description: 'Home decor and lifestyle products',
        productCount: 23,
        status: 'active'
      }
    ];

    return NextResponse.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Categories fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch categories'
    }, { status: 500 });
  }
}
