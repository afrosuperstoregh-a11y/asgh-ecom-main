import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Mock promotions data
    const promotions = [
      {
        id: 'PROMO-001',
        name: 'Summer Sale',
        description: 'Get 20% off on all summer collection',
        type: 'PERCENTAGE',
        value: 20,
        minimumAmount: 50,
        maximumDiscount: 100,
        usageLimit: 1000,
        usageCount: 245,
        isActive: true,
        startsAt: '2024-01-01',
        endsAt: '2024-03-31',
        autoApply: false,
        priority: 1,
        codes: [
          {
            id: 'CODE-001',
            code: 'SUMMER20',
            usageLimit: 500,
            usageCount: 123
          }
        ],
        _count: {
          usage: 245
        }
      },
      {
        id: 'PROMO-002',
        description: 'Free shipping on orders over $75',
        type: 'FREE_SHIPPING',
        value: 0,
        minimumAmount: 75,
        usageLimit: null,
        usageCount: 189,
        isActive: true,
        startsAt: '2024-01-15',
        endsAt: null,
        autoApply: true,
        priority: 2,
        codes: [],
        _count: {
          usage: 189
        }
      },
      {
        id: 'PROMO-003',
        name: 'New Customer Discount',
        description: '$10 off for first-time customers',
        type: 'FIXED_AMOUNT',
        value: 10,
        minimumAmount: 25,
        maximumDiscount: 10,
        usageLimit: 200,
        usageCount: 67,
        isActive: true,
        startsAt: '2024-01-01',
        endsAt: '2024-12-31',
        autoApply: true,
        priority: 3,
        codes: [
          {
            id: 'CODE-002',
            code: 'WELCOME10',
            usageLimit: 200,
            usageCount: 67
          }
        ],
        _count: {
          usage: 67
        }
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        promotions,
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1
        }
      }
    });

  } catch (error) {
    console.error('Promotions fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch promotions'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Mock promotion creation
    const newPromotion = {
      id: `PROMO-${Date.now()}`,
      ...body,
      usageCount: 0,
      isActive: true,
      autoApply: false,
      priority: 999,
      codes: body.codes || [],
      _count: {
        usage: 0
      }
    };

    return NextResponse.json({
      success: true,
      data: newPromotion,
      message: 'Promotion created successfully'
    });

  } catch (error) {
    console.error('Promotion creation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create promotion'
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Promotion ID is required'
      }, { status: 400 });
    }

    // Mock promotion update
    const updatedPromotion = {
      id,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedPromotion,
      message: 'Promotion updated successfully'
    });

  } catch (error) {
    console.error('Promotion update error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update promotion'
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Promotion ID is required'
      }, { status: 400 });
    }

    // Mock promotion deletion
    return NextResponse.json({
      success: true,
      message: 'Promotion deleted successfully'
    });

  } catch (error) {
    console.error('Promotion deletion error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete promotion'
    }, { status: 500 });
  }
}
