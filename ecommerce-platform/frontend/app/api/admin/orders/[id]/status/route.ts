import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAuthErrorResponse, createSuccessResponse } from '../../../lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Order status update API called for order:', params.id);
    
    // Authenticate the request
    const auth = await authenticateAdmin();
    if (auth.error) {
      console.log('Order status update auth failed:', auth.error);
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    const body = await request.json();
    const { status, notifyCustomer = true } = body;
    
    console.log('Updating order status:', { orderId: params.id, status, notifyCustomer });
    
    // Mock order status update
    const updatedOrder = {
      id: params.id,
      status,
      updatedAt: new Date().toISOString(),
      notificationSent: notifyCustomer
    };

    return NextResponse.json(createSuccessResponse(updatedOrder));

  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update order status'
    }, { status: 500 });
  }
}
