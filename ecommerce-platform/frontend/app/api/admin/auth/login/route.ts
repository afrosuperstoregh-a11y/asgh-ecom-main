import { NextRequest, NextResponse } from 'next/server';

// Production admin login proxy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Production admin login proxy:', { email, passwordLength: password?.length });

    // Hardcoded admin credentials for production
    const adminCredentials = [
      { email: 'admin@afrosuperstore.ca', password: 'Admin123!' },
      { email: 'info@afrosuperstore.ca', password: 'Iamtech@100' }
    ];

    const user = adminCredentials.find(cred => cred.email === email && cred.password === password);

    if (user) {
      const response = {
        success: true,
        message: 'Login successful',
        user: {
          id: '1',
          email: user.email,
          name: user.email.split('@')[0],
          role: 'super_admin',
          permissions: ['read', 'write', 'delete', 'admin']
        },
        token: 'prod-jwt-token-' + Date.now()
      };

      console.log('✅ Production admin login successful:', user.email);
      return NextResponse.json(response);
    } else {
      console.log('❌ Invalid credentials for:', email);
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('❌ Production login proxy error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
