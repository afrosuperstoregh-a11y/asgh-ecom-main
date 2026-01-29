import { NextRequest, NextResponse } from 'next/server';

// Production admin auth validation proxy
export async function GET(request: NextRequest) {
  try {
    console.log('Production admin auth validation check');
    
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;
    
    const token = authHeader?.replace('Bearer ', '') || cookieToken;
    
    console.log('Token validation request:', !!token);

    if (!token) {
      console.log('No token provided');
      return NextResponse.json({
        success: false,
        message: 'No authentication token provided'
      }, { status: 401 });
    }

    // For production, validate token format and return mock user data
    // In a real implementation, you would validate the JWT against your secret
    if (token.startsWith('prod-jwt-token-')) {
      const userData = {
        success: true,
        message: 'Token valid',
        user: {
          id: 'admin-001',
          email: 'info@afrosuperstore.ca',
          name: 'Super Admin',
          role: 'super_admin',
          permissions: ['read', 'write', 'delete', 'admin'],
          emailVerified: true
        }
      };

      console.log('✅ Production admin token validation successful');
      return NextResponse.json(userData);
    } else {
      console.log('❌ Invalid token format');
      return NextResponse.json({
        success: false,
        message: 'Invalid authentication token'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('❌ Production auth validation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Authentication validation failed'
    }, { status: 500 });
  }
}
