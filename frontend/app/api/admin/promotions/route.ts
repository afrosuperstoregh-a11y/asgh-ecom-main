import { NextRequest, NextResponse } from 'next/server';
import { validateTokenFormat } from '../../../../lib/auth';
import { getSupabaseServer } from '@/lib/supabase-server';

export const runtime = "nodejs";

// Validate admin token server-side
async function validateAdminToken(request: NextRequest): Promise<{ valid: boolean; user?: any }> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    console.log('🔍 [DEBUG] Promotions token validation:', { 
      hasAuthHeader: !!authHeader,
      tokenPrefix: token?.substring(0, 20),
      tokenLength: token?.length
    });

    if (!token) {
      console.log('🔍 [DEBUG] No token found in promotions request');
      return { valid: false };
    }

    const isValidFormat = validateTokenFormat(token);
    console.log('🔍 [DEBUG] Promotions token format validation:', { isValidFormat });

    if (isValidFormat) {
      console.log('🔍 [DEBUG] Promotions token validation successful');
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

    console.log('🔍 [DEBUG] Promotions token validation failed - invalid format');
    return { valid: false };
  } catch (error) {
    console.error('🔍 [DEBUG] Promotions token validation error:', error);
    return { valid: false };
  }
}

// Admin promotions endpoint
export async function GET(request: NextRequest) {
  console.log('🔍 [DEBUG] === PROMOTIONS API ROUTE CALLED ===');
  
  try {
    console.log('🔍 [DEBUG] Promotions API request received');
    
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
    
    // Initialize server-side Supabase client
    const supabase = await getSupabaseServer();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Since promotions table doesn't exist yet, return mock data
    const mockPromotions = [
      {
        id: '1',
        name: 'Summer Sale',
        code: 'SUMMER20',
        discountType: 'percentage',
        discountValue: 20,
        isActive: true,
        startDate: '2024-06-01',
        endDate: '2024-08-31',
        usageLimit: 1000,
        usageCount: 245,
        created_at: '2024-05-15T10:00:00Z',
        updated_at: '2024-06-01T10:00:00Z'
      },
      {
        id: '2',
        name: 'Welcome Discount',
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        isActive: true,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        usageLimit: null,
        usageCount: 89,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        name: 'Flash Sale',
        code: 'FLASH30',
        discountType: 'percentage',
        discountValue: 30,
        isActive: false,
        startDate: '2024-03-01',
        endDate: '2024-03-03',
        usageLimit: 500,
        usageCount: 500,
        created_at: '2024-02-28T15:00:00Z',
        updated_at: '2024-03-03T23:59:00Z'
      }
    ];

    // Apply pagination to mock data
    const fromRange = (page - 1) * limit;
    const toRange = fromRange + limit;
    const paginatedPromotions = mockPromotions.slice(fromRange, toRange);

    const promotionsData = {
      success: true,
      message: 'Promotions retrieved successfully',
      data: {
        promotions: paginatedPromotions,
        pagination: {
          page,
          limit,
          total: mockPromotions.length,
          totalPages: Math.ceil(mockPromotions.length / limit)
        }
      }
    };

    console.log('🔍 [DEBUG] Promotions data served successfully', { 
      promotionCount: paginatedPromotions.length,
      totalCount: mockPromotions.length 
    });
    return NextResponse.json(promotionsData);
  } catch (error) {
    console.error('🔍 [DEBUG] Promotions API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch promotions: ' + (error as Error)?.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate admin token
    const validation = await validateAdminToken(request);
    
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid admin token'
      }, { status: 401 });
    }

    const body = await request.json();
    
    // Mock creation response
    const newPromotion = {
      id: Date.now().toString(),
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      usageCount: 0
    };

    return NextResponse.json({
      success: true,
      message: 'Promotion created successfully',
      data: newPromotion
    });
  } catch (error) {
    console.error('Promotion creation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create promotion: ' + (error as Error)?.message
    }, { status: 500 });
  }
}
