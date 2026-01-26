import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Mock payments data
    const payments = [
      {
        id: 'PAY-001',
        amount: 89.99,
        currency: 'USD',
        status: 'COMPLETED',
        provider: 'stripe',
        providerId: 'pi_1234567890',
        createdAt: '2024-01-25T10:30:00Z',
        order: {
          id: 'ORD-001',
          orderNumber: 'ORD-2024-001',
          total: 89.99,
          user: {
            name: 'John Doe',
            email: 'john@example.com'
          }
        },
        paymentMethod: {
          type: 'card',
          last4: '4242',
          brand: 'visa'
        },
        refunds: []
      },
      {
        id: 'PAY-002',
        amount: 124.50,
        currency: 'USD',
        status: 'COMPLETED',
        provider: 'paypal',
        providerId: 'PAYID_1234567890',
        createdAt: '2024-01-25T14:15:00Z',
        order: {
          id: 'ORD-002',
          orderNumber: 'ORD-2024-002',
          total: 124.50,
          user: {
            name: 'Jane Smith',
            email: 'jane@example.com'
          }
        },
        paymentMethod: {
          type: 'paypal',
          email: 'jane@example.com'
        },
        refunds: []
      },
      {
        id: 'PAY-003',
        amount: 67.25,
        currency: 'USD',
        status: 'FAILED',
        provider: 'stripe',
        providerId: 'pi_0987654321',
        createdAt: '2024-01-24T16:45:00Z',
        order: {
          id: 'ORD-003',
          orderNumber: 'ORD-2024-003',
          total: 67.25,
          guestEmail: 'guest@example.com'
        },
        paymentMethod: {
          type: 'card',
          last4: '5555',
          brand: 'mastercard'
        },
        refunds: []
      },
      {
        id: 'PAY-004',
        amount: 45.00,
        currency: 'USD',
        status: 'REFUNDED',
        provider: 'stripe',
        providerId: 'pi_1122334455',
        createdAt: '2024-01-23T11:20:00Z',
        order: {
          id: 'ORD-004',
          orderNumber: 'ORD-2024-004',
          total: 45.00,
          user: {
            name: 'Mike Johnson',
            email: 'mike@example.com'
          }
        },
        paymentMethod: {
          type: 'card',
          last4: '1234',
          brand: 'visa'
        },
        refunds: [
          {
            id: 'REF-001',
            amount: 45.00,
            status: 'COMPLETED',
            createdAt: '2024-01-24T09:00:00Z',
            reason: 'Customer requested refund'
          }
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: 1,
          limit: 20,
          total: 4,
          totalPages: 1
        }
      }
    });

  } catch (error) {
    console.error('Payments fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch payments'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Mock payment processing
    const newPayment = {
      id: `PAY-${Date.now()}`,
      ...body,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      refunds: []
    };

    return NextResponse.json({
      success: true,
      data: newPayment,
      message: 'Payment processed successfully'
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process payment'
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Payment ID is required'
      }, { status: 400 });
    }

    // Mock payment status update
    const updatedPayment = {
      id,
      status: status || 'PENDING',
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedPayment,
      message: 'Payment updated successfully'
    });

  } catch (error) {
    console.error('Payment update error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update payment'
    }, { status: 500 });
  }
}
