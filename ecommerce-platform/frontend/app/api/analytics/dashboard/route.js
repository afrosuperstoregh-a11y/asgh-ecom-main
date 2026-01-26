import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock analytics data
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
      ],
      topProducts: [
        { name: 'Afro Print Dress', sales: 234, revenue: 11700.00 },
        { name: 'Kente Cloth Scarf', sales: 189, revenue: 9450.00 },
        { name: 'Ankara Headwrap', sales: 156, revenue: 4680.00 }
      ],
      recentOrders: [
        { id: 'ORD-001', customer: 'John Doe', amount: 89.99, status: 'completed' },
        { id: 'ORD-002', customer: 'Jane Smith', amount: 124.50, status: 'processing' },
        { id: 'ORD-003', customer: 'Mike Johnson', amount: 67.25, status: 'pending' }
      ]
    };

    return NextResponse.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch analytics data'
    }, { status: 500 });
  }
}
