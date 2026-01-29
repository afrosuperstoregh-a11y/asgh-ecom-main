import { NextResponse } from 'next/server';

// Production features stats proxy
export async function GET() {
  try {
    console.log('Production features stats request');

    // Mock feature statistics
    const mockStats = {
      total: 15,
      by_category: {
        product: 5,
        category: 3,
        promotion: 3,
        customer: 4
      },
      by_type: {
        string: 6,
        number: 4,
        boolean: 3,
        select: 2,
        url: 1,
        text: 1,
        datetime: 1
      },
      active: 15,
      required: 4
    };

    const response = {
      success: true,
      stats: mockStats
    };

    console.log('✅ Production features stats served');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Production features stats proxy error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch feature statistics'
    }, { status: 500 });
  }
}
