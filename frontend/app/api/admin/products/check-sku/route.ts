import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { validateAdminToken } from '@/lib/auth';

export const runtime = "nodejs";

// GET - Check if SKU exists
export async function GET(request: NextRequest) {
  try {
    console.log(' [DEBUG] === CHECK SKU API ROUTE CALLED ===');
    
    // Validate admin token
    const validation = await validateAdminToken(request);
    if (!validation.valid) {
      console.log(' [DEBUG] Token validation failed');
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid admin token'
      }, { status: 401 });
    }
    
    console.log(' [DEBUG] Token validation successful for user:', validation.user?.email);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');
    const excludeId = searchParams.get('excludeId');
    
    if (!sku) {
      console.log(' [DEBUG] Missing SKU parameter');
      return NextResponse.json({
        success: false,
        message: 'SKU parameter is required'
      }, { status: 400 });
    }
    
    console.log(' [DEBUG] Checking SKU:', { sku, excludeId });
    
    // Initialize Supabase client
    const supabaseClient = await getSupabaseServer();
    
    // Build query to check if SKU exists
    let query = supabaseClient
      .from('products')
      .select('id, sku')
      .eq('sku', sku)
      .limit(1);
    
    // Exclude specific ID if provided (for updates)
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(' [DEBUG] SKU check error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to check SKU: ' + error.message
      }, { status: 500 });
    }
    
    const exists = data && data.length > 0;
    
    console.log(' [DEBUG] SKU check result:', { sku, exists, count: data?.length });
    
    return NextResponse.json({
      success: true,
      data: {
        exists,
        sku,
        product: exists ? data[0] : null
      },
      message: exists ? 'SKU already exists' : 'SKU is available'
    });
    
  } catch (error) {
    console.error(' [DEBUG] Check SKU API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to check SKU: ' + (error as Error)?.message
    }, { status: 500 });
  }
}
