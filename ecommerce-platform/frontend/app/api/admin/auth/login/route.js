import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    // Debug logging (remove in production)
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

    // Try to authenticate with Railway backend first
    try {
      console.log('Attempting Railway backend authentication...');
      const backendResponse = await fetch('https://asca-ecom-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        console.log('Railway backend authentication successful:', backendData);
        
        if (backendData.success && backendData.user) {
          // Create admin session from backend response
          const mockPayload = {
            id: backendData.user.id,
            email: backendData.user.email,
            name: backendData.user.name,
            role: 'SUPER_ADMIN',
            emailVerified: backendData.user.emailVerified,
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
      }
    } catch (backendError) {
      console.log('Railway backend authentication failed, falling back to local auth:', backendError.message);
    }

    // Fallback to hardcoded super admin authentication
    console.log('Using fallback hardcoded authentication...');
    console.log('Checking credentials:', { 
      email: trimmedEmail, 
      expectedEmail: 'info@afrosuperstore.ca',
      passwordMatch: trimmedPassword === 'Iamtech@100'
    });
    
    if (trimmedEmail === 'info@afrosuperstore.ca' && trimmedPassword === 'Iamtech@100') {
      // Create a mock JWT token (in production, use real JWT)
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
    console.error('Admin login API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
