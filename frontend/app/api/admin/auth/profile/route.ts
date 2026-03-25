import { NextRequest, NextResponse } from 'next/server';

// Validate Supabase JWT token
async function validateSupabaseToken(request: NextRequest, supabaseAdmin: any): Promise<{ valid: boolean; user?: any }> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return { valid: false };
    }

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      console.error('Token validation error:', error);
      return { valid: false };
    }

    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email
      }
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false };
  }
}

// Get user profile endpoint
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [PROFILE] Profile API called');
    
    // Validate environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('🔍 [PROFILE] Missing required environment variables');
      return NextResponse.json({
        success: false,
        message: 'Server configuration error - missing database credentials'
      }, { status: 500 });
    }
    
    // Initialize Supabase client inside the handler
    let supabaseAdmin;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    } catch (supabaseError) {
      console.error('🔍 [PROFILE] Failed to initialize Supabase client:', supabaseError);
      return NextResponse.json({
        success: false,
        message: 'Server configuration error - database connection failed'
      }, { status: 500 });
    }
    
    // Validate Supabase token
    const validation = await validateSupabaseToken(request, supabaseAdmin);
    
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid or expired token'
      }, { status: 401 });
    }

    console.log('🔍 [PROFILE] Token validated for:', validation.user.email);
    
    // Get user profile using service role (bypasses RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role, first_name, last_name')
      .eq('email', validation.user.email)
      .single();

    if (profileError || !profile) {
      console.error('🔍 [PROFILE] Profile lookup error:', profileError);
      return NextResponse.json({
        success: false,
        message: 'User profile not found'
      }, { status: 404 });
    }

    console.log('🔍 [PROFILE] Profile found:', profile.role);
    console.log('🔍 [PROFILE] Profile data:', profile);

    return NextResponse.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: profile
    });
    
  } catch (error) {
    console.error('🔍 [PROFILE] API error:', error);
    return NextResponse.json({
      success: false,
      message: 'API Error: ' + (error as Error)?.message
    }, { status: 500 });
  }
}
