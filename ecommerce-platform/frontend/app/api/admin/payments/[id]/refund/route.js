import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { amount, reason } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Refund amount is required and must be greater than 0'
      }, { status: 400 });
    }

    // Mock refund processing
    const refund = {
      id: `REF-${Date.now()}`,
      paymentId: id,
      amount: parseFloat(amount),
      status: 'PROCESSING',
      reason: reason || 'Customer requested refund',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: refund,
      message: 'Refund processed successfully'
    });

  } catch (error) {
    console.error('Refund processing error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process refund'
    }, { status: 500 });
  }
}
