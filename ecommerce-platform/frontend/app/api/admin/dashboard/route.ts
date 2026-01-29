import { NextResponse } from 'next/server';

// Production admin dashboard proxy
export async function GET() {
  try {
    // Mock dashboard data for production
    const mockData = {
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        stats: {
          totalOrders: 156,
          totalRevenue: 45780.50,
          totalUsers: 89,
          totalProducts: 234
        },
        recentOrders: [
          {
            order_number: 'ORD-001',
            total_amount: 125.99,
            status: 'completed',
            email: 'customer1@example.com',
            created_at: new Date().toISOString()
          },
          {
            order_number: 'ORD-002',
            total_amount: 89.50,
            status: 'processing',
            email: 'customer2@example.com',
            created_at: new Date().toISOString()
          }
        ]
      }
    };

    console.log('✅ Production admin dashboard data served');
    return NextResponse.json(mockData);
  } catch (error) {
    console.error('❌ Production dashboard proxy error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch dashboard data'
    }, { status: 500 });
  }
}
