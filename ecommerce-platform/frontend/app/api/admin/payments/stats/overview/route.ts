import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAuthErrorResponse, createSuccessResponse } from '../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Payment stats API called');
    
    // Authenticate the request
    const auth = await authenticateAdmin();
    if (auth.error) {
      console.log('Payment stats auth failed:', auth.error);
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    console.log('Payment stats auth successful, returning data');
    
    // Mock payment statistics
    const stats = {
      overview: {
        totalPayments: 1250,
        completedPayments: 1189,
        failedPayments: 31,
        refundedPayments: 30,
        successRate: 95.1,
        totalRevenue: 125430.50,
        totalRefunded: 2340.75,
        netRevenue: 123089.75
      },
      daily: [
        { date: '2024-01-15', payments: 45, revenue: 3450.50 },
        { date: '2024-01-16', payments: 52, revenue: 4120.75 },
        { date: '2024-01-17', payments: 48, revenue: 3890.25 },
        { date: '2024-01-18', payments: 58, revenue: 4560.00 },
        { date: '2024-01-19', payments: 62, revenue: 5125.50 },
        { date: '2024-01-20', payments: 55, revenue: 4890.75 }
      ],
      byProvider: [
        { provider: 'stripe', payments: 890, revenue: 89560.25, successRate: 96.2 },
        { provider: 'paypal', payments: 360, revenue: 35870.25, successRate: 94.8 }
      ]
    };

    return NextResponse.json({ success: true, data: { overview: stats.overview } });

  } catch (error) {
    console.error('Payment stats API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch payment statistics'
    }, { status: 500 });
  }
}
