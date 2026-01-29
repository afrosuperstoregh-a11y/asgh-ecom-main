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
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Trim whitespace from inputs
    const trimmedEmail = email?.trim();
    const trimmedPassword = password?.trim();
    
    // Input validation
    if (!trimmedEmail || !trimmedPassword) {
      console.log('❌ Missing email or password');
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      console.log('❌ Invalid email format:', trimmedEmail);
      return NextResponse.json({
        success: false,
        message: 'Invalid email format'
      }, { status: 400 });
    }

    // Password strength validation
    if (trimmedPassword.length < 8) {
      console.log('❌ Password too short:', trimmedPassword.length);
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 8 characters long'
      }, { status: 400 });
    }

    // Authenticate with Supabase
    console.log('🔐 Authenticating with Supabase...');
    console.log('📧 Email:', trimmedEmail);
    console.log('🔑 Password length:', trimmedPassword.length);
    
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPassword
    });

    if (error) {
      console.log('❌ Supabase authentication failed:', error.message);
      console.log('❌ Error details:', error);
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    if (!data.user || !data.session) {
      console.log('❌ No user or session returned from Supabase');
      console.log('❌ Data received:', data);
      return NextResponse.json({
        success: false,
        message: 'Authentication failed'
      }, { status: 401 });
    }

    console.log('✅ Supabase authentication successful');
    console.log('✅ User ID:', data.user.id);
    console.log('✅ User Email:', data.user.email);
    console.log('✅ User Metadata:', data.user.user_metadata);

    // Check if user has admin role
    const userRole = data.user.user_metadata?.role || data.user.user_metadata?.user_type;
    console.log('🔍 Checking user role:', userRole);
    
    if (!['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      console.log('❌ User does not have admin role:', userRole);
      return NextResponse.json({
        success: false,
        message: 'Insufficient permissions'
      }, { status: 403 });
    }

    console.log('✅ User has admin role:', userRole);
    
    // Set Supabase session token
    const cookieStore = await cookies();
    
    console.log('🍪 Setting authentication cookies...');
    
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

    console.log('✅ Authentication cookies set successfully');

    const responseData = {
      success: true,
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
        role: userRole,
        emailVerified: data.user.email_confirmed_at != null
      }
    };

    console.log('✅ Returning successful response:', responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Login API error:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred during login'
    }, { status: 500 });
  }
}
