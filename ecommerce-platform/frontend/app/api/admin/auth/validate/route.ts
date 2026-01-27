import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'No token provided'
      }, { status: 401 });
    }

    try {
      // Decode the mock token
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        // Clear expired token
        cookieStore.delete('auth-token');
        
        return NextResponse.json({
          success: false,
          message: 'Token expired'
        }, { status: 401 });
      }

      // Check if user has admin role
      if (!payload.role || !['ADMIN', 'SUPER_ADMIN'].includes(payload.role)) {
        return NextResponse.json({
          success: false,
          message: 'Insufficient permissions'
        }, { status: 403 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: payload.id,
          email: payload.email,
          name: payload.name,
          role: payload.role,
          emailVerified: payload.emailVerified
        }
      });
    } catch (decodeError) {
      // Clear invalid token
      cookieStore.delete('auth-token');
      
      return NextResponse.json({
        success: false,
        message: 'Invalid token'
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
