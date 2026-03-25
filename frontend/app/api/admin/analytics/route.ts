import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Shared token validation logic
function validateTokenFormat(token: string): boolean {
  if (!token.startsWith('prod-jwt-token-')) {
    return false;
  }

  const tokenParts = token.split('-');
  const timestamp = tokenParts[3];
  
  if (timestamp) {
    const tokenTime = parseInt(timestamp);
    const currentTime = Date.now();
    const isExpired = (currentTime - tokenTime) > 30 * 24 * 60 * 1000; // 30 days for development
    
    if (isExpired) {
      console.log('Token expired:', { tokenTime, currentTime, age: currentTime - tokenTime });
      return false;
    }
  }
  
  return true;
}

// Validate admin token server-side
async function validateAdminToken(request: NextRequest): Promise<{ valid: boolean; user?: any }> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    console.log('🔍 [DEBUG] Analytics token validation:', { 
      hasAuthHeader: !!authHeader,
      tokenPrefix: token?.substring(0, 20),
      tokenLength: token?.length
    });

    if (!token) {
      console.log('🔍 [DEBUG] No token found in analytics request');
      return { valid: false };
    }

    const isValidFormat = validateTokenFormat(token);
    console.log('🔍 [DEBUG] Analytics token format validation:', { isValidFormat });

    if (isValidFormat) {
      console.log('🔍 [DEBUG] Analytics token validation successful');
      return {
        valid: true,
        user: {
          id: 'admin-001',
          email: 'info@afrosuperstore.ca',
          name: 'Super Admin',
          role: 'super_admin',
          permissions: ['read', 'write', 'delete', 'admin', 'super_admin']
        }
      };
    }

    console.log('🔍 [DEBUG] Analytics token validation failed - invalid format');
    return { valid: false };
  } catch (error) {
    console.error('🔍 [DEBUG] Analytics token validation error:', error);
    return { valid: false };
  }
}

// Admin analytics endpoint
export async function GET(request: NextRequest) {
  console.log('🔍 [DEBUG] === ANALYTICS API ROUTE CALLED ===');
  
  try {
    console.log('🔍 [DEBUG] Analytics API request received');
    
    // Validate admin token using custom validation
    const validation = await validateAdminToken(request);
    console.log('🔍 [DEBUG] Token validation result:', validation);
    
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid admin token'
      }, { status: 401 });
    }

    console.log('🔍 [DEBUG] Admin authenticated:', validation.user?.email);
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Initialize server-side Supabase client
    const supabase = supabaseAdmin;

    // Calculate date range based on range parameter
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Mock analytics data since we don't have real data yet
    const mockAnalytics = {
      overview: {
        totalRevenue: 45678.90,
        totalOrders: 234,
        totalCustomers: 189,
        conversionRate: 3.4,
        averageOrderValue: 195.12,
        revenueChange: 12.5,
        ordersChange: 8.3,
        customersChange: 15.2
      },
      customerMetrics: {
        newCustomers: 45,
        returningCustomers: 144,
        customerRetentionRate: 76.2,
        averageCustomerLifetime: 245.67,
        customerSatisfactionScore: 4.6
      },
      revenueChart: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue: Math.random() * 2000 + 500,
        orders: Math.floor(Math.random() * 15) + 3
      })),
      topProducts: [
        { id: '1', name: 'African Print Shirt', sales: 45, revenue: 2245.50 },
        { id: '2', name: 'Dashiki Dress', sales: 38, revenue: 1899.00 },
        { id: '3', name: 'Kente Cloth Scarf', sales: 32, revenue: 1599.68 },
        { id: '4', name: 'Ankara Skirt', sales: 28, revenue: 1399.72 },
        { id: '5', name: 'Traditional Headwrap', sales: 25, revenue: 1248.75 }
      ],
      topCategories: [
        { id: '1', name: 'Clothing', sales: 89, revenue: 4456.78 },
        { id: '2', name: 'Accessories', sales: 67, revenue: 2234.56 },
        { id: '3', name: 'Home Decor', sales: 45, revenue: 1789.23 },
        { id: '4', name: 'Beauty', sales: 33, revenue: 1234.89 }
      ],
      recentOrders: [
        {
          id: 'ORD-001',
          customer: 'John Doe',
          amount: 156.78,
          status: 'completed',
          date: new Date().toISOString()
        },
        {
          id: 'ORD-002',
          customer: 'Jane Smith',
          amount: 89.99,
          status: 'processing',
          date: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'ORD-003',
          customer: 'Mike Johnson',
          amount: 234.56,
          status: 'completed',
          date: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      trafficSources: [
        { source: 'Direct', visitors: 1234, percentage: 35.2, conversionRate: 3.4 },
        { source: 'Organic Search', visitors: 987, percentage: 28.1, conversionRate: 4.2 },
        { source: 'Social Media', visitors: 654, percentage: 18.6, conversionRate: 2.8 },
        { source: 'Referral', visitors: 432, percentage: 12.3, conversionRate: 5.1 },
        { source: 'Email', visitors: 210, percentage: 5.9, conversionRate: 6.7 }
      ]
    };

    const analyticsData = {
      success: true,
      message: 'Analytics data retrieved successfully',
      data: mockAnalytics,
      range,
      generated_at: new Date().toISOString()
    };

    console.log('🔍 [DEBUG] Analytics data served successfully', { 
      range,
      revenue: mockAnalytics.overview.totalRevenue 
    });
    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('🔍 [DEBUG] Analytics API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch analytics: ' + (error as Error)?.message
    }, { status: 500 });
  }
}
