import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Authentication middleware
async function authenticate() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) {
    return { error: 'No token provided', status: 401 };
  }

  try {
    const payload = JSON.parse(atob(token));
    
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { error: 'Token expired', status: 401 };
    }

    if (!payload.role || !['ADMIN', 'SUPER_ADMIN'].includes(payload.role)) {
      return { error: 'Insufficient permissions', status: 403 };
    }

    return { user: payload };
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
}

export async function GET(request) {
  try {
    // Authenticate the request
    const auth = await authenticate();
    if (auth.error) {
      return NextResponse.json({
        success: false,
        message: auth.error
      }, { status: auth.status });
    }
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
          orderNumber: 'ORD-001',
          total: 89.99,
          status: 'PROCESSING',
          user: {
            name: 'John Doe',
            email: 'john@example.com'
          }
        },
        {
          id: 'ORD-002',
          orderNumber: 'ORD-002',
          total: 124.50,
          status: 'PROCESSING',
          user: {
            name: 'Jane Smith',
            email: 'jane@example.com'
          }
        },
        {
          id: 'ORD-003',
          orderNumber: 'ORD-003',
          total: 67.25,
          status: 'PENDING',
          user: {
            name: 'Mike Johnson',
            email: 'mike@example.com'
          }
        }
      ],
      topProducts: [
        {
          productId: 'PROD-001',
          product: {
            id: 'PROD-001',
            name: 'Afro Print Dress',
            sku: 'APD-001'
          },
          _sum: {
            total: 11700.00
          },
          _count: {
            total: 234
          }
        },
        {
          productId: 'PROD-002',
          product: {
            id: 'PROD-002',
            name: 'Kente Cloth Scarf',
            sku: 'KCS-002'
          },
          _sum: {
            total: 9450.00
          },
          _count: {
            total: 189
          }
        },
        {
          productId: 'PROD-003',
          product: {
            id: 'PROD-003',
            name: 'Ankara Headwrap',
            sku: 'AHW-003'
          },
          _sum: {
            total: 4680.00
          },
          _count: {
            total: 156
          }
        }
      ],
      lowStockProducts: [
        {
          id: 'PROD-004',
          product: {
            id: 'PROD-004',
            name: 'Dashiki Shirt'
          },
          sku: 'DAS-004',
          stock: 3
        },
        {
          id: 'PROD-005',
          product: {
            id: 'PROD-005',
            name: 'African Beads'
          },
          sku: 'ABE-005',
          stock: 5
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
