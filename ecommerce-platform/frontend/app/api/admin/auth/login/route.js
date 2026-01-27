import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    // Debug logging (remove in production)
    console.log('Login attempt:', { email, passwordLength: password?.length });
    
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

    // TEMPORARY: Mock authentication for testing
    // In production, this should validate against your database
    console.log('Checking credentials:', { 
      email: trimmedEmail, 
      expectedEmail: 'info@afrosuperstore.ca',
      passwordMatch: trimmedPassword === 'Iamtech@10'
    });
    
    if (trimmedEmail === 'info@afrosuperstore.ca' && trimmedPassword === 'Iamtech@10') {
      // Create a mock JWT token (in production, use real JWT)
      const mockPayload = {
        id: 'admin-001',
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

    return NextResponse.json({
      success: false,
      message: 'Invalid email or password'
    }, { status: 401 });

  } catch (error) {
    console.error('Admin login API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
