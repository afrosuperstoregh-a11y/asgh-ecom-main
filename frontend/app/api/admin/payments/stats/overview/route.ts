import { NextRequest, NextResponse } from 'next/server';
import { validateTokenFormat } from '@/lib/auth';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/admin/payments/stats/overview - Get payment statistics
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

    // Mock payment statistics - replace with real database queries
    const statsData = {
      success: true,
      message: 'Payment statistics retrieved successfully',
      data: {
        overview: {
          totalRevenue: 45678.90,
          totalPayments: 234,
          completedPayments: 220,
          failedPayments: 8,
          refundedPayments: 6,
          successRate: 94.2,
          totalRefunded: 567.89,
          netRevenue: 45111.01,
          averageTransactionValue: 195.12,
          todayRevenue: 1234.56,
          weeklyRevenue: 8901.23,
          monthlyRevenue: 34567.89,
          pendingPayments: 12
        }
      }
    };

    return NextResponse.json(statsData);

  } catch (error) {
    console.error('Payment stats API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
