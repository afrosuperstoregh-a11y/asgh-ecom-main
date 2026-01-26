import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock analytics data for general analytics endpoint
    const analyticsData = {
      overview: {
        totalRevenue: 125430.50,
        totalOrders: 847,
        totalCustomers: 1256,
        conversionRate: 3.2
      },
      revenueChart: [
        { date: '2024-01-01', revenue: 2340.50 },
        { date: '2024-01-02', revenue: 3456.00 },
        { date: '2024-01-03', revenue: 2890.75 },
        { date: '2024-01-04', revenue: 4123.25 },
        { date: '2024-01-05', revenue: 3678.00 }
      ]
    };

    return NextResponse.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch analytics data'
    }, { status: 500 });
  }
}
