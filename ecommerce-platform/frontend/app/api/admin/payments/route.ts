import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAuthErrorResponse, createSuccessResponse } from '../lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin payments API called');
    
    // Authenticate the request
    const auth = await authenticateAdmin();
    if (auth.error) {
      console.log('Payments auth failed:', auth.error);
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    console.log('Payments auth successful, returning data');
    
    // Mock payments data
    const payments = [
      {
        id: 'PAY-001',
        amount: 125.50,
        currency: 'USD',
        status: 'COMPLETED',
        provider: 'stripe',
        providerId: 'pi_1234567890',
        createdAt: '2024-01-20T14:30:00Z',
        order: {
          id: 'ORD-001',
          orderNumber: 'ORD-001',
          total: 125.50,
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
        amount: 89.99,
        currency: 'USD',
        status: 'COMPLETED',
        provider: 'paypal',
        providerId: 'PAYID-1234567890',
        createdAt: '2024-01-19T10:15:00Z',
        order: {
          id: 'ORD-002',
          orderNumber: 'ORD-002',
          total: 89.99,
          user: {
            name: 'Jane Smith',
            email: 'jane@example.com'
          }
        },
        paymentMethod: {
          type: 'paypal'
        },
        refunds: []
      },
      {
        id: 'PAY-003',
        amount: 234.75,
        currency: 'USD',
        status: 'REFUNDED',
        provider: 'stripe',
        providerId: 'pi_1234567891',
        createdAt: '2024-01-18T16:45:00Z',
        order: {
          id: 'ORD-003',
          orderNumber: 'ORD-003',
          total: 234.75,
          guestEmail: 'guest@example.com'
        },
        paymentMethod: {
          type: 'card',
          last4: '5555',
          brand: 'mastercard'
        },
        refunds: [
          {
            id: 'REF-001',
            amount: 234.75,
            status: 'COMPLETED',
            createdAt: '2024-01-19T09:20:00Z'
          }
        ]
      }
    ];

    // Mock pagination
    const pagination = {
      page: 1,
      limit: 20,
      total: payments.length,
      pages: Math.ceil(payments.length / 20)
    };

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pagination
      }
    });

  } catch (error) {
    console.error('Payments API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch payments'
    }, { status: 500 });
  }
}
