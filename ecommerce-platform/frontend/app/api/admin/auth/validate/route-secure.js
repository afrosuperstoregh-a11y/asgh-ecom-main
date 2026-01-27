import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'No token provided'
      }, { status: 401 });
    }

    // Call backend to validate token
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/admin/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': `auth-token=${token}`,
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || 'unknown',
        'User-Agent': request.headers.get('user-agent') || 'admin-panel'
      },
    });

    const data = await backendResponse.json();

    if (backendResponse.ok && data.success) {
      return NextResponse.json({
        success: true,
        user: data.user
      });
    } else {
      // Clear invalid cookies
      cookieStore.delete('auth-token');
      cookieStore.delete('refresh-token');
      
      return NextResponse.json({
        success: false,
        message: data.message || 'Invalid authentication'
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
