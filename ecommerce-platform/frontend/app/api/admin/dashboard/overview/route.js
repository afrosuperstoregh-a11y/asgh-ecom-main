import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Mock dashboard data
    const dashboardData = {
      overview: {
        totalOrders: 847,
        totalRevenue: 125430.50,
        totalCustomers: 1256,
        totalProducts: 234,
        pendingOrders: 23
      },
      growth: {
        orders: 12.5,
        revenue: 8.3
      },
      currentMonth: {
        orders: 156,
        revenue: 23450.75
      },
      recentOrders: [
        {
          id: 'ORD-001',
          customer: 'John Doe',
          amount: 89.99,
          status: 'completed',
          date: '2024-01-25'
        },
        {
          id: 'ORD-002',
          customer: 'Jane Smith',
          amount: 124.50,
          status: 'processing',
          date: '2024-01-25'
        },
        {
          id: 'ORD-003',
          customer: 'Mike Johnson',
          amount: 67.25,
          status: 'pending',
          date: '2024-01-24'
        }
      ],
      topProducts: [
        {
          id: 'PROD-001',
          name: 'Afro Print Dress',
          sales: 234,
          revenue: 11700.00
        },
        {
          id: 'PROD-002',
          name: 'Kente Cloth Scarf',
          sales: 189,
          revenue: 9450.00
        },
        {
          id: 'PROD-003',
          name: 'Ankara Headwrap',
          sales: 156,
          revenue: 4680.00
        }
      ],
      lowStockProducts: [
        {
          id: 'PROD-004',
          name: 'Dashiki Shirt',
          stock: 3,
          threshold: 10
        },
        {
          id: 'PROD-005',
          name: 'African Beads',
          stock: 5,
          threshold: 15
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch dashboard data'
    }, { status: 500 });
  }
}
