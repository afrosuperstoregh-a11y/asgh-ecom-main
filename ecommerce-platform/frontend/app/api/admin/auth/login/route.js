import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
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

    // Super admin authentication (hardcoded for reliability)
    console.log('Checking super admin credentials...');
    console.log('Email match:', trimmedEmail === 'info@afrosuperstore.ca');
    console.log('Password match:', trimmedPassword === 'Iamtech@100');
    
    if (trimmedEmail === 'info@afrosuperstore.ca' && trimmedPassword === 'Iamtech@100') {
      console.log('✅ Super admin authentication successful');
      
      // Create admin session token
      const mockPayload = {
        id: 'cdc9e3ae-08d0-455c-b322-6e7b4b03e906',
        email: 'info@afrosuperstore.ca',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        emailVerified: true,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      };
      
      const mockToken = btoa(JSON.stringify(mockPayload));

      // Set secure HTTP-only cookies
      const cookieStore = cookies();
      
      cookieStore.set('auth-token', mockToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      });

      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: {
          id: mockPayload.id,
          email: mockPayload.email,
          name: mockPayload.name,
          role: mockPayload.role,
          emailVerified: mockPayload.emailVerified
        }
      });
    }

    console.log('❌ Authentication failed for:', trimmedEmail);
    return NextResponse.json({
      success: false,
      message: 'Invalid email or password'
    }, { status: 401 });

  } catch (error) {
    console.error('❌ Admin login API error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
