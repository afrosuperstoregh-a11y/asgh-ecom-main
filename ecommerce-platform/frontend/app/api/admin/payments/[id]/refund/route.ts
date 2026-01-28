import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAuthErrorResponse, createSuccessResponse } from '../../../lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Payment refund API called for payment:', params.id);
    
    // Authenticate the request
    const auth = await authenticateAdmin();
    if (auth.error) {
      console.log('Payment refund auth failed:', auth.error);
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    const body = await request.json();
    const { amount, reason } = body;
    
    console.log('Processing refund:', { paymentId: params.id, amount, reason });
    
    // Mock refund processing
    const refund = {
      id: `REF-${Date.now()}`,
      paymentId: params.id,
      amount,
      reason,
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json(createSuccessResponse(refund));

  } catch (error) {
    console.error('Payment refund error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process refund'
    }, { status: 500 });
  }
}
