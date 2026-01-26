import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Mock orders data
    const orders = [
      {
        id: 'ORD-001',
        orderNumber: 'ORD-2024-001',
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        total: 89.99,
        createdAt: '2024-01-25',
        user: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        items: [
          {
            id: 'ITEM-001',
            quantity: 2,
            total: 89.99,
            product: {
              name: 'Afro Print Dress',
              images: ['/images/dress1.jpg']
            }
          }
        ],
        payments: [
          {
            id: 'PAY-001',
            status: 'COMPLETED',
            amount: 89.99,
            provider: 'stripe'
          }
        ]
      },
      {
        id: 'ORD-002',
        orderNumber: 'ORD-2024-002',
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        total: 124.50,
        createdAt: '2024-01-25',
        user: {
          name: 'Jane Smith',
          email: 'jane@example.com'
        },
        items: [
          {
            id: 'ITEM-002',
            quantity: 1,
            total: 124.50,
            product: {
              name: 'Kente Cloth Scarf',
              images: ['/images/scarf1.jpg']
            }
          }
        ],
        payments: [
          {
            id: 'PAY-002',
            status: 'COMPLETED',
            amount: 124.50,
            provider: 'paypal'
          }
        ]
      },
      {
        id: 'ORD-003',
        orderNumber: 'ORD-2024-003',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        total: 67.25,
        createdAt: '2024-01-24',
        guestEmail: 'guest@example.com',
        items: [
          {
            id: 'ITEM-003',
            quantity: 3,
            total: 67.25,
            product: {
              name: 'Ankara Headwrap',
              images: ['/images/headwrap1.jpg']
            }
          }
        ],
        payments: []
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

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, status, paymentStatus } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Order ID is required'
      }, { status: 400 });
    }

    // Mock order status update
    const updatedOrder = {
      id,
      status: status || 'PROCESSING',
      paymentStatus: paymentStatus || 'PENDING',
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update order'
    }, { status: 500 });
  }
}
