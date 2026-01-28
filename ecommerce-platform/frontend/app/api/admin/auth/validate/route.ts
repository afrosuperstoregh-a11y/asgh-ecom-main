import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('supabase-auth-token')?.value;
    const refreshToken = cookieStore.get('supabase-refresh-token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({
        success: false,
        message: 'No authentication token provided'
      }, { status: 401 });
    }

    try {
      // Validate the token with Supabase
      const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

      if (error || !data.user) {
        // Clear invalid tokens
        cookieStore.delete('supabase-auth-token');
        cookieStore.delete('supabase-refresh-token');
        
        return NextResponse.json({
          success: false,
          message: 'Invalid or expired authentication token'
        }, { status: 401 });
      }

      // Check if user has admin role
      const userRole = data.user.user_metadata?.role || data.user.user_metadata?.user_type;
      if (!['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        return NextResponse.json({
          success: false,
          message: 'Insufficient permissions'
        }, { status: 403 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
          role: userRole,
          emailVerified: data.user.email_confirmed_at != null
        }
      });
    } catch (decodeError) {
      // Clear invalid tokens
      cookieStore.delete('supabase-auth-token');
      cookieStore.delete('supabase-refresh-token');
      
      return NextResponse.json({
        success: false,
        message: 'Invalid authentication token'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Auth validation API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Authentication validation failed'
    }, { status: 500 });
  }
}
