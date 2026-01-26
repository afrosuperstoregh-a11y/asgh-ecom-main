import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Mock orders data
    const orders = [
      {
        id: 'ORD-001',
        orderNumber: 'ORD-2024-001',
        customer: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        amount: 89.99,
        status: 'completed',
        paymentStatus: 'paid',
        date: '2024-01-25'
      },
      {
        id: 'ORD-002',
        orderNumber: 'ORD-2024-002',
        customer: {
          name: 'Jane Smith',
          email: 'jane@example.com'
        },
        amount: 124.50,
        status: 'processing',
        paymentStatus: 'paid',
        date: '2024-01-25'
      },
      {
        id: 'ORD-003',
        orderNumber: 'ORD-2024-003',
        customer: {
          name: 'Mike Johnson',
          email: 'mike@example.com'
        },
        amount: 67.25,
        status: 'pending',
        paymentStatus: 'pending',
        date: '2024-01-24'
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1
        }
      }
    });

  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch orders'
    }, { status: 500 });
  }
}
