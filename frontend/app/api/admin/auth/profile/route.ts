import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validate Supabase JWT token
async function validateSupabaseToken(request: NextRequest): Promise<{ valid: boolean; user?: any }> {
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
    
    // Validate Supabase token
    const validation = await validateSupabaseToken(request);
    
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
