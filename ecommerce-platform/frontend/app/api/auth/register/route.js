import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 8 characters long'
        }
      }, { status: 400 });
    }

    // Mock registration - replace with real registration logic
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: Date.now(),
          email,
          name: name || 'New User',
          role: 'customer'
        },
        token: 'mock-jwt-token-for-new-user',
        refreshToken: 'mock-refresh-token'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration failed'
      }
    }, { status: 500 });
  }
}
