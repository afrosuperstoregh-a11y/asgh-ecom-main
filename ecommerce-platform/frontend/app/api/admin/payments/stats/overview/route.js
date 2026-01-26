import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock payment statistics data
    const paymentStats = {
      overview: {
        totalPayments: 1247,
        completedPayments: 1098,
        failedPayments: 89,
        refundedPayments: 60,
        successRate: 88.1,
        totalRevenue: 125430.50,
        totalRefunded: 8750.25,
        netRevenue: 116680.25
      },
      dailyStats: [
        { date: '2024-01-01', payments: 45, revenue: 3450.00 },
        { date: '2024-01-02', payments: 52, revenue: 4230.50 },
        { date: '2024-01-03', payments: 38, revenue: 2890.75 },
        { date: '2024-01-04', payments: 61, revenue: 5123.25 },
        { date: '2024-01-05', payments: 47, revenue: 3678.00 }
      ],
      paymentMethods: [
        { provider: 'stripe', count: 856, percentage: 68.6 },
        { provider: 'paypal', count: 267, percentage: 21.4 },
        { provider: 'square', count: 124, percentage: 9.9 }
      ]
    };

    return NextResponse.json({
      success: true,
      data: paymentStats
    });

  } catch (error) {
    console.error('Payment stats error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch payment statistics'
    }, { status: 500 });
  }
}
