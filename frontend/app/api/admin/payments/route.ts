import { NextRequest, NextResponse } from 'next/server';
import { validateTokenFormat } from '@/lib/auth';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/admin/payments - Get payment data
export async function GET(request: NextRequest) {
  try {
    // Validate token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'No authentication token provided'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (!validateTokenFormat(token)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired authentication token'
      }, { status: 401 });
    }

    // Mock payment data - replace with real database queries
    const paymentsData = {
      success: true,
      message: 'Payment data retrieved successfully',
      data: {
        payments: [
          {
            id: 'pay_001',
            orderId: 'order_001',
            amount: 299.99,
            currency: 'USD',
            status: 'completed',
            method: 'credit_card',
            customerEmail: 'customer@example.com',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'pay_002',
            orderId: 'order_002',
            amount: 149.99,
            currency: 'USD',
            status: 'pending',
            method: 'paypal',
            customerEmail: 'customer2@example.com',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          }
        ],
        stats: {
          totalRevenue: 449.98,
          completedPayments: 1,
          pendingPayments: 1,
          failedPayments: 0
        }
      }
    };

    return NextResponse.json(paymentsData);

  } catch (error) {
    console.error('Payments API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/admin/payments - Create or update payment
export async function POST(request: NextRequest) {
  try {
    // Validate token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'No authentication token provided'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (!validateTokenFormat(token)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired authentication token'
      }, { status: 401 });
    }

    const body = await request.json();
    
    // Mock payment creation/update logic
    const paymentData = {
      success: true,
      message: 'Payment processed successfully',
      data: {
        id: `pay_${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString(),
      }
    };

    return NextResponse.json(paymentData);

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({
      success: false,
      message: 'Payment processing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
