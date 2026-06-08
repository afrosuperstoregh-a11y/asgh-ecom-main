import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

// Admin orders endpoint
export async function GET(request: NextRequest) {
  console.log('🔍 [DEBUG] === ORDERS API ROUTE CALLED ===');
  
  try {
    console.log('🔍 [DEBUG] Orders API request received');
    
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
    const sortByParam = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Map frontend field names to database field names
    const fieldMapping: Record<string, string> = {
      'createdAt': 'created_at',
      'orderNumber': 'order_number',
      'total': 'total'
    };
    
    const sortBy = fieldMapping[sortByParam] || sortByParam;

    // Start building query with order items
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total,
        status,
        payment_status,
        guest_email,
        created_at,
        updated_at,
        profiles!orders_user_id_fkey (
          id,
          email,
          first_name,
          last_name
        ),
        order_items(
          id,
          product_id,
          quantity,
          price,
          total,
          products(
            id,
            name,
            images
          )
        ),
        payments(
          id,
          amount,
          status,
          provider,
          provider_id,
          created_at
        )
      `);

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Get total count for pagination
    const countQuery = supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    const { count } = await countQuery;

    // Apply pagination
    const fromRange = (page - 1) * limit;
    const toRange = fromRange + limit - 1;
    
    const { data: orders, error } = await query
      .range(fromRange, toRange);

    if (error) {
      console.error('🔍 [DEBUG] Orders Supabase error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch orders: ' + error.message
      }, { status: 500 });
    }

    // Transform data to match frontend interface
    const transformedOrders = (orders as any[])?.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status.toUpperCase(),
      paymentStatus: order.payment_status.toUpperCase(),
      total: order.total,
      createdAt: order.created_at,
      user: order.profiles?.[0] ? {
        name: `${order.profiles[0].first_name || ''} ${order.profiles[0].last_name || ''}`.trim() || 'Customer',
        email: order.profiles[0].email
      } : null,
      guestEmail: order.guest_email,
      items: (order.order_items as any[])?.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        total: item.total,
        product: {
          id: item.product_id,
          name: (item.products as any)?.[0]?.name || 'Product',
          images: (item.products as any)?.[0]?.images || []
        }
      })) || [],
      payments: (order.payments as any[])?.map((payment: any) => ({
        id: payment.id,
        status: payment.status.toUpperCase(),
        amount: payment.amount,
        provider: payment.provider
      })) || []
    })) || [];

    const ordersData = {
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders: transformedOrders,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    };

    console.log('🔍 [DEBUG] Orders data served successfully', { 
      orderCount: orders?.length || 0,
      totalCount: count 
    });
    return NextResponse.json(ordersData);
  } catch (error) {
    console.error('🔍 [DEBUG] Orders API error:', error);
    return NextResponse.json({
      success: false,
      message: 'API Error: ' + (error as Error)?.message
    }, { status: 500 });
  }
}

// Update order status endpoint
export async function PUT(request: NextRequest) {
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
    const { orderId, status, notifyCustomer = true } = body;

    if (!orderId || !status) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: orderId and status'
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
    const supabase = await getSupabaseServer();

    // Update order status
    const { data: order, error } = await (supabase as any)
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
