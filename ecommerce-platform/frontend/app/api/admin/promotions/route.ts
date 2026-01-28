import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAuthErrorResponse, createSuccessResponse } from '../lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin promotions API called');
    
    // Authenticate the request
    const auth = await authenticateAdmin();
    if (auth.error) {
      console.log('Promotions auth failed:', auth.error);
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    console.log('Promotions auth successful, returning data');
    
    // Mock promotions data
    const promotions = [
      {
        id: 'PROMO-001',
        name: 'Summer Sale',
        type: 'percentage',
        value: 20,
        code: 'SUMMER20',
        description: '20% off all summer collection',
        startDate: '2024-06-01',
        endDate: '2024-08-31',
        usageLimit: 1000,
        usageCount: 234,
        isActive: true,
        createdAt: '2024-05-15T10:00:00Z',
        _count: {
          usage: 234
        }
      },
      {
        id: 'PROMO-002',
        name: 'Free Shipping',
        type: 'free_shipping',
        value: 0,
        code: 'FREESHIP',
        description: 'Free shipping on orders over $50',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        usageLimit: null,
        usageCount: 567,
        isActive: true,
        createdAt: '2023-12-20T14:30:00Z',
        _count: {
          usage: 567
        }
      },
      {
        id: 'PROMO-003',
        name: 'New Year Discount',
        type: 'fixed_amount',
        value: 10,
        code: 'NEWYEAR10',
        description: '$10 off your first order',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        usageLimit: 500,
        usageCount: 123,
        isActive: false,
        createdAt: '2023-12-25T09:00:00Z',
        _count: {
          usage: 123
        }
      }
    ];

    // Mock pagination
    const pagination = {
      page: 1,
      limit: 20,
      total: promotions.length,
      pages: Math.ceil(promotions.length / 20)
    };

    return NextResponse.json({
      success: true,
      data: {
        promotions,
        pagination
      }
    });

  } catch (error) {
    console.error('Promotions API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch promotions'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAdmin();
    if (auth.error) {
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    const body = await request.json();
    console.log('Creating promotion:', body);

    // Mock promotion creation
    const newPromotion = {
      id: `PROMO-${Date.now()}`,
      ...body,
      usageCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      _count: {
        usage: 0
      }
    };

    return NextResponse.json(createSuccessResponse(newPromotion));

  } catch (error) {
    console.error('Create promotion error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create promotion'
    }, { status: 500 });
  }
}
