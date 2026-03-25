import { NextRequest, NextResponse } from 'next/server';

// Shared token validation logic
function validateTokenFormat(token: string): boolean {
  if (!token.startsWith('prod-jwt-token-')) {
    return false;
  }

  const tokenParts = token.split('-');
  
  // Handle both formats: prod-jwt-token-{timestamp} and prod-jwt-token-admin-{timestamp}
  let timestamp: string | undefined;
  
  if (tokenParts[3] && !isNaN(parseInt(tokenParts[3]))) {
    // Format: prod-jwt-token-{timestamp}
    timestamp = tokenParts[3];
  } else if (tokenParts[4] && !isNaN(parseInt(tokenParts[4]))) {
    // Format: prod-jwt-token-admin-{timestamp}
    timestamp = tokenParts[4];
  }
  
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

// Admin customer block/unblock endpoint
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ customerId: string; action: string }> }
) {
  console.log('🔍 [DEBUG] === CUSTOMER ACTION API ROUTE CALLED ===');
  
  try {
    console.log('🔍 [DEBUG] Customer action request received');
    
    // Await the params as required by Next.js 15
    const { customerId, action } = await context.params;
    console.log('🔍 [DEBUG] Parsed params:', { customerId, action });
    
    // Validate admin token using shared validation
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || !validateTokenFormat(token)) {
      console.log('🔍 [DEBUG] Unauthorized customer action attempt - invalid token');
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid or expired admin token'
      }, { status: 401 });
    }

    console.log('🔍 [DEBUG] Admin authenticated for customer action');
    
    if (!customerId || !action) {
      return NextResponse.json({
        success: false,
        message: 'Missing customer ID or action'
      }, { status: 400 });
    }

    if (!['block', 'unblock'].includes(action)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid action. Must be block or unblock'
      }, { status: 400 });
    }

    // Mock customer data update - replace with real database queries
    const updatedCustomer = {
      id: customerId,
      role: action === 'block' ? 'blocked' : 'customer',
      updated_at: new Date().toISOString()
    };

    console.log('🔍 [DEBUG] Customer updated successfully:', { customerId, action });
    
    return NextResponse.json({
      success: true,
      message: `Customer ${action}ed successfully`,
      data: updatedCustomer
    });
    
  } catch (error) {
    console.error('🔍 [DEBUG] Customer action API error:', error);
    return NextResponse.json({
      success: false,
      message: 'API Error: ' + (error as Error)?.message
    }, { status: 500 });
  }
}
