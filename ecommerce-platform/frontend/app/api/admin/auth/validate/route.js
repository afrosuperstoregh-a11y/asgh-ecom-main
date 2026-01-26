import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'No token provided'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Mock validation - in production, validate the JWT token
    if (token === 'mock-jwt-token-for-super-admin' || token === 'mock-jwt-token-for-admin') {
      const userData = token === 'mock-jwt-token-for-super-admin' 
        ? {
            id: 'admin-001',
            email: 'info@afrosuperstore.ca',
            name: 'Super Admin',
            role: {
              name: 'Super Admin',
              permissions: ['read', 'write', 'delete', 'admin']
            }
          }
        : {
            id: 'admin-demo',
            email: 'admin@afrosuperstore.ca',
            name: 'Admin User',
            role: {
              name: 'Admin',
              permissions: ['read', 'write']
            }
          };

      return NextResponse.json({
        success: true,
        user: userData
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid token'
    }, { status: 401 });

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Token validation failed'
    }, { status: 500 });
  }
}
