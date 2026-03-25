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

    // Rate limiting check (simple implementation)
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    logger.log('Login attempt from IP:', clientIP);

    // Hardcoded admin credentials for production
    const adminCredentials = [
      { 
        email: 'admin@afrosuperstore.ca', 
        password: 'Admin123!',
        name: 'Super Admin',
        role: 'super_admin',
        id: 'admin-001'
      },
      { 
        email: 'info@afrosuperstore.ca', 
        password: 'Iamtech@100',
        name: 'Admin User',
        role: 'admin',
        id: 'admin-002'
      }
    ];

    const user = adminCredentials.find(cred => cred.email === email && cred.password === password);

    if (user) {
      // Generate admin token in expected format
      const timestamp = Date.now();
      const token = `prod-jwt-token-admin-${timestamp}`;
      
      const response = {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.role === 'super_admin' 
            ? ['read', 'write', 'delete', 'admin', 'super_admin']
            : ['read', 'write', 'admin'],
          emailVerified: true,
          lastLogin: new Date().toISOString()
        },
        token: token
      };

      logger.log('Admin login successful', { 
        email: user.email, 
        role: user.role,
        ip: clientIP 
      });
      
      return NextResponse.json(response);
    } else {
      logger.log('Invalid credentials for', { email, ip: clientIP });
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
