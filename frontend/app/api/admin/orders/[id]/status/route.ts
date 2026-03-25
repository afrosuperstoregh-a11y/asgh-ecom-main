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

    if (!token) {
      return { valid: false };
    }

    if (validateTokenFormat(token)) {
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

    return { valid: false };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false };
  }
}

// Update order status endpoint
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log('🔍 [DEBUG] === ORDER STATUS UPDATE API ROUTE CALLED ===');
  
  try {
    // Validate admin token using custom validation
    const validation = await validateAdminToken(request);
    console.log('🔍 [DEBUG] Token validation result:', validation);
    
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid admin token'
      }, { status: 401 });
    }

    console.log('🔍 [DEBUG] Admin authenticated for status update:', validation.user?.email);
    
    // Parse request body
    const body = await request.json();
    const { status, notifyCustomer = true } = body;
    const { id: orderId } = await params;

    if (!status) {
      return NextResponse.json({
        success: false,
        message: 'Missing required field: status'
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return NextResponse.json({
        success: false,
        message: 'Invalid status value'
      }, { status: 400 });
    }

    // Initialize server-side Supabase client
    const supabase = supabaseAdmin;

    // Update order status
    const { data: order, error } = await supabase
      .from('orders')
      .update({ 
        status: status.toLowerCase(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('🔍 [DEBUG] Order status update error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to update order status: ' + error.message
      }, { status: 500 });
    }

    console.log('🔍 [DEBUG] Order status updated successfully', { orderId, newStatus: status });

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    console.error('🔍 [DEBUG] Order status update API error:', error);
    return NextResponse.json({
      success: false,
      message: 'API Error: ' + (error as Error)?.message
    }, { status: 500 });
  }
}
