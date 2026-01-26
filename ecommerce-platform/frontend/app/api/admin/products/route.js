import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Mock products data
    const products = [
      {
        id: 'PROD-001',
        name: 'Afro Print Dress',
        sku: 'APD-001',
        price: 50.00,
        stock: 45,
        category: 'Clothing',
        status: 'active',
        createdAt: '2024-01-15'
      },
      {
        id: 'PROD-002',
        name: 'Kente Cloth Scarf',
        sku: 'KCS-002',
        price: 25.00,
        stock: 89,
        category: 'Accessories',
        status: 'active',
        createdAt: '2024-01-14'
      },
      {
        id: 'PROD-003',
        name: 'Ankara Headwrap',
        sku: 'AHW-003',
        price: 30.00,
        stock: 156,
        category: 'Accessories',
        status: 'active',
        createdAt: '2024-01-13'
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1
        }
      }
    });

  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch products'
    }, { status: 500 });
  }
}
