import { NextRequest, NextResponse } from 'next/server';

// Simple login API endpoint for testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Check credentials (same logic as login page)
    const validAdminEmails = [process.env.NEXT_PUBLIC_ADMIN_EMAIL, process.env.ADMIN_STAFF_EMAIL].filter(Boolean);
    const validCredentials: Record<string, string> = {};
    
    if (process.env.NEXT_PUBLIC_ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      validCredentials[process.env.NEXT_PUBLIC_ADMIN_EMAIL] = process.env.ADMIN_PASSWORD;
    }
    
    if (process.env.ADMIN_STAFF_EMAIL && process.env.ADMIN_STAFF_PASSWORD) {
      validCredentials[process.env.ADMIN_STAFF_EMAIL] = process.env.ADMIN_STAFF_PASSWORD;
    }

    if (!validAdminEmails.includes(email) || password !== validCredentials[email as keyof typeof validCredentials]) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // Create admin token
    const timestamp = Date.now();
    const token = `prod-jwt-token-admin-${timestamp}`;
    
    const user = {
      id: email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin-001' : 'admin-002',
      email: email,
      name: email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'Super Admin' : 'Admin User',
      role: email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'super_admin' : 'admin',
      permissions: ['read', 'write', 'delete', 'admin', email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'super_admin' : '']
    };

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user,
        redirectTo: '/admin'
      }
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
