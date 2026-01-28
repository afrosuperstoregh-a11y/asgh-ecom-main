import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAuthErrorResponse, createSuccessResponse } from '../lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin analytics API called');
    
    // Authenticate the request
    const auth = await authenticateAdmin();
    if (auth.error) {
      console.log('Analytics auth failed:', auth.error);
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    
    console.log('Analytics auth successful, returning data for range:', range);
    
    // Mock analytics data based on range
    const analyticsData = {
      overview: {
        totalRevenue: 125430.50,
        totalOrders: 847,
        totalCustomers: 1256,
        conversionRate: 3.2,
        averageOrderValue: 148.02
      },
      sales: {
        daily: [
          { date: '2024-01-15', revenue: 2340.50, orders: 18 },
          { date: '2024-01-16', revenue: 3120.75, orders: 24 },
          { date: '2024-01-17', revenue: 2890.25, orders: 21 },
          { date: '2024-01-18', revenue: 3560.00, orders: 28 },
          { date: '2024-01-19', revenue: 4125.50, orders: 32 },
          { date: '2024-01-20', revenue: 3890.75, orders: 29 }
        ],
        byCategory: [
          { category: 'Clothing', revenue: 45670.25, orders: 312 },
          { category: 'Accessories', revenue: 32140.50, orders: 245 },
          { category: 'Home Decor', revenue: 19890.00, orders: 156 },
          { category: 'Beauty', revenue: 27729.75, orders: 134 }
        ]
      },
      customers: {
        newCustomers: [
          { date: '2024-01-15', count: 12 },
          { date: '2024-01-16', count: 18 },
          { date: '2024-01-17', count: 15 },
          { date: '2024-01-18', count: 22 },
          { date: '2024-01-19', count: 19 },
          { date: '2024-01-20', count: 25 }
        ],
        retention: {
          new: 45,
          returning: 55
        }
      },
      products: {
        topSelling: [
          {
            productId: 'PROD-001',
            name: 'Afro Print Dress',
            sku: 'APD-001',
            sales: 234,
            revenue: 11700.00
          },
          {
            productId: 'PROD-002',
            name: 'Kente Cloth Scarf',
            sku: 'KCS-002',
            sales: 189,
            revenue: 9450.00
          },
          {
            productId: 'PROD-003',
            name: 'Ankara Headwrap',
            sku: 'AHW-003',
            sales: 156,
            revenue: 4680.00
          }
        ],
        lowStock: [
          {
            productId: 'PROD-004',
            name: 'Dashiki Shirt',
            sku: 'DAS-004',
            stock: 3,
            status: 'critical'
          },
          {
            productId: 'PROD-005',
            name: 'African Beads',
            sku: 'ABE-005',
            stock: 8,
            status: 'low'
          }
        ]
      }
    };

    return NextResponse.json(createSuccessResponse(analyticsData));

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch analytics data'
    }, { status: 500 });
  }
}
