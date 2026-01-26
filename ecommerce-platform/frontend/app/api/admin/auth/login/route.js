import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 });
    }

    // Check for super admin credentials
    if (email === 'info@afrosuperstore.ca' && password === 'Iamtech@100') {
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: {
          id: 'admin-001',
          email: 'info@afrosuperstore.ca',
          name: 'Super Admin',
          role: 'super_admin',
          emailVerified: true
        },
        token: 'mock-jwt-token-for-super-admin'
      });
    }

    // For demo purposes, accept any admin credentials
    // In production, this should validate against database
    if (email.includes('@afrosuperstore.ca')) {
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: {
          id: 'admin-demo',
          email: email,
          name: 'Admin User',
          role: 'admin',
          emailVerified: true
        },
        token: 'mock-jwt-token-for-admin'
      });
    }

    // Invalid credentials
    return NextResponse.json({
      success: false,
      message: 'Invalid email or password'
    }, { status: 401 });

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
