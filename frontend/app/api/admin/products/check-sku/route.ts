import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateTokenFormat } from '@/lib/auth';

// Helper function to validate admin token
function validateAdminToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false };
    }

    const token = authHeader.substring(7);
    const isValidFormat = validateTokenFormat(token);
    
    if (isValidFormat) {
      return {
        valid: true,
        user: {
          id: 'admin-001',
          email: 'info@afrosuperstore.ca',
          name: 'Super Admin',
          role: 'super_admin'
        }
      };
    }

    return { valid: false };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false };
  }
}

// GET - Check if SKU exists
export async function GET(request: NextRequest) {
  try {
    console.log(' [DEBUG] === CHECK SKU API ROUTE CALLED ===');
    
    // Validate admin token
    const validation = validateAdminToken(request);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid admin token'
      }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');
    const excludeId = searchParams.get('excludeId');
    
    if (!sku) {
      return NextResponse.json({
        success: false,
        message: 'SKU parameter is required'
      }, { status: 400 });
    }
    
    console.log(' [DEBUG] Checking SKU:', { sku, excludeId });
    
    // Initialize Supabase client with SERVICE ROLE KEY for admin operations
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
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
