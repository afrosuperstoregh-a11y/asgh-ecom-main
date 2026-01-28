import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Debug logging
    console.log('=== ADMIN LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password length:', password?.length);
    
    // Trim whitespace from inputs
    const trimmedEmail = email?.trim();
    const trimmedPassword = password?.trim();
    
    // Input validation
    if (!trimmedEmail || !trimmedPassword) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email format'
      }, { status: 400 });
    }

    // Password strength validation
    if (trimmedPassword.length < 8) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 8 characters long'
      }, { status: 400 });
    }

    // Authenticate with Supabase
    console.log('Authenticating with Supabase...');
    
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPassword
    });

    if (error) {
      console.log('❌ Supabase authentication failed:', error.message);
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    if (!data.user || !data.session) {
      console.log('❌ No user or session returned from Supabase');
      return NextResponse.json({
        success: false,
        message: 'Authentication failed'
      }, { status: 401 });
    }

    // Check if user has admin role
    const userRole = data.user.user_metadata?.role || data.user.user_metadata?.user_type;
    if (!['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      console.log('❌ User does not have admin role:', userRole);
      return NextResponse.json({
        success: false,
        message: 'Insufficient permissions'
      }, { status: 403 });
    }

    console.log('✅ Supabase authentication successful');
    
    // Set Supabase session token
    const cookieStore = await cookies();
    
    cookieStore.set('supabase-auth-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: data.session.expires_in || 3600,
      path: '/'
    });

    cookieStore.set('supabase-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
        role: userRole,
        emailVerified: data.user.email_confirmed_at != null
      }
    });

  } catch (error) {
    console.error('❌ Admin login API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error');
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
