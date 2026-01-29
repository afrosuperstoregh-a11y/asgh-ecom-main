import { NextRequest, NextResponse } from 'next/server';

// Temporary admin login proxy until backend is deployed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Temporary admin login proxy:', { email, passwordLength: password?.length });

    // Hardcoded admin credentials from Other.txt
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
        token: 'temp-jwt-token-' + Date.now()
      };

      console.log('✅ Temporary admin login successful:', user.email);
      return NextResponse.json(response);
    } else {
      console.log('❌ Invalid credentials for:', email);
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('❌ Temporary login proxy error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
