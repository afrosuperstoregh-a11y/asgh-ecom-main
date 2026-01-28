import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAuthErrorResponse, createSuccessResponse } from '../../../lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Customer status update API called for customer:', params.id);
    
    // Authenticate the request
    const auth = await authenticateAdmin();
    if (auth.error) {
      console.log('Customer status update auth failed:', auth.error);
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    const body = await request.json();
    const { action, reason } = body;
    
    console.log('Updating customer status:', { customerId: params.id, action, reason });
    
    // Mock customer status update
    const updatedCustomer = {
      id: params.id,
      status: action === 'block' ? 'blocked' : 'active',
      updatedAt: new Date().toISOString(),
      reason
    };

    return NextResponse.json(createSuccessResponse(updatedCustomer));

  } catch (error) {
    console.error('Customer status update error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update customer status'
    }, { status: 500 });
  }
}
