import { NextRequest, NextResponse } from 'next/server';

// Environment-safe logging
const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  log: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[API] ${message}`, data || '');
    }
  },
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[API] ${message}`, error || '');
    }
  }
};

// Production admin login proxy - handles CORS and authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    logger.log('Production admin login attempt', { email, passwordLength: password?.length });

    // Hardcoded admin credentials for production
    const adminCredentials = [
      { email: 'admin@afrosuperstore.ca', password: 'Admin123!' },
      { email: 'info@afrosuperstore.ca', password: 'Iamtech@100' }
    ];

    const user = adminCredentials.find(cred => cred.email === email && cred.password === password);

    if (user) {
      const token = 'prod-jwt-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      
      const response = {
        success: true,
        message: 'Login successful',
        user: {
          id: user.email === 'info@afrosuperstore.ca' ? 'admin-001' : 'admin-002',
          email: user.email,
          name: user.email === 'info@afrosuperstore.ca' ? 'Super Admin' : 'Admin User',
          role: user.email === 'info@afrosuperstore.ca' ? 'super_admin' : 'admin',
          permissions: ['read', 'write', 'delete', 'admin'],
          emailVerified: true
        },
        token: token
      };

      // Set secure cookie
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none' as const,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      };

      const nextResponse = NextResponse.json(response);
      nextResponse.cookies.set('auth-token', token, cookieOptions);

      logger.log('Production admin login successful', user.email);
      return nextResponse;
    } else {
      logger.log('Invalid credentials for', email);
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }
  } catch (error) {
    logger.error('Production login proxy error', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
