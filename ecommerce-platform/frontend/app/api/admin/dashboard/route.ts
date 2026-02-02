import { NextRequest, NextResponse } from 'next/server';
import { validateTokenFormat } from '../../../../lib/auth';

// Environment-safe logging
const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  log: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[API] ${message}`, data || '');
    }
  },
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[API] ${message}`, error || '');
    }
  }
};

// Admin dashboard data endpoint
export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || !validateTokenFormat(token)) {
      logger.log('Unauthorized dashboard access attempt');
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    logger.log('Admin dashboard data request authenticated');

    // Mock dashboard data
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

    logger.log('Admin dashboard data served successfully');
    return NextResponse.json(mockData);
  } catch (error) {
    logger.error('Dashboard API error', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch dashboard data'
    }, { status: 500 });
  }
}
