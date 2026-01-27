import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAuthErrorResponse, createSuccessResponse } from '../lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin orders API called');
    
    // Authenticate the request
    const auth = await authenticateAdmin();
    if (auth.error) {
      console.log('Orders auth failed:', auth.error);
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    console.log('Orders auth successful, returning data');
    
    // Mock orders data
    const orders = [
      {
        id: 'ORD-001',
        orderNumber: 'ORD-001',
        total: 89.99,
        status: 'PROCESSING',
        user: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        createdAt: '2024-01-20',
        items: [
          {
            id: 'ITEM-001',
            product: {
              name: 'Afro Print Dress',
              sku: 'APD-001'
            },
            quantity: 1,
            price: 50.00
          },
          {
            id: 'ITEM-002',
            product: {
              name: 'Kente Cloth Scarf',
              sku: 'KCS-002'
            },
            quantity: 1,
            price: 39.99
          }
        ]
      },
      {
        id: 'ORD-002',
        orderNumber: 'ORD-002',
        total: 124.50,
        status: 'PROCESSING',
        user: {
          name: 'Jane Smith',
          email: 'jane@example.com'
        },
        createdAt: '2024-01-19',
        items: [
          {
            id: 'ITEM-003',
            product: {
              name: 'Ankara Headwrap',
              sku: 'AHW-003'
            },
            quantity: 2,
            price: 62.25
          }
        ]
      }
    ];

    return NextResponse.json(createSuccessResponse({
      orders,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      }
    }));

  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(createAuthErrorResponse('Failed to fetch orders', 500), { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateAdmin();
    if (auth.error) {
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    const body = await request.json();
    const { id, status } = body;
    
    if (!id || !status) {
      return NextResponse.json(createAuthErrorResponse('Order ID and status are required', 400), { status: 400 });
    }

    // Mock order status update
    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`
    });

  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(createAuthErrorResponse('Failed to update order', 500), { status: 500 });
  }
}
