import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      }, { status: 400 });
    }

    // Check for super admin credentials
    if (email === 'info@afrosuperstore.ca' && password === 'Iamtech@100') {
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 'admin-001',
            email: 'info@afrosuperstore.ca',
            name: 'Super Admin',
            role: 'super_admin',
            emailVerified: true
          },
          token: 'mock-jwt-token-for-super-admin',
          refreshToken: 'mock-refresh-token'
        }
      });
    }

    // Mock authentication - replace with real auth logic
    if (email === 'demo@example.com' && password === 'password123') {
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 1,
            email: 'demo@example.com',
            name: 'Demo User',
            role: 'customer'
          },
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token'
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials'
      }
    }, { status: 401 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Login failed'
      }
    }, { status: 500 });
  }
}
