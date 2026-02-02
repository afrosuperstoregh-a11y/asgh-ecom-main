import { NextRequest, NextResponse } from 'next/server';
import { validateTokenFormat } from '../../../../../lib/auth';

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

// Admin auth validation endpoint
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Admin auth validation check');
    logger.log('Admin auth validation check');
    
    // Get token from Authorization header only (localStorage strategy)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('🔍 [DEBUG] Token validation request', { 
      hasAuthHeader: !!authHeader,
      tokenPrefix: token?.substring(0, 20)
    });
    logger.log('Token validation request', !!token);

    if (!token) {
      console.log('🔍 [DEBUG] No token provided');
      logger.log('No token provided');
      return NextResponse.json({
        success: false,
        message: 'No authentication token provided'
      }, { status: 401 });
    }

    // Validate token format and expiration
    if (validateTokenFormat(token)) {
      console.log('🔍 [DEBUG] Valid token format');
      
      // Return user data
      const userData = {
        success: true,
        message: 'Token valid',
        user: {
          id: 'admin-001',
          email: 'info@afrosuperstore.ca',
          name: 'Super Admin',
          role: 'super_admin',
          permissions: ['read', 'write', 'delete', 'admin', 'super_admin'],
          emailVerified: true,
          lastLogin: new Date().toISOString(),
          sessionActive: true
        }
      };

      console.log('🔍 [DEBUG] Token validation successful');
      logger.log('Token validation successful');
      return NextResponse.json(userData);
    } else {
      console.log('🔍 [DEBUG] Invalid or expired token:', token);
      logger.log('Invalid or expired token');
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired authentication token'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('🔍 [DEBUG] Auth validation error:', error);
    logger.error('Auth validation error', error);
    return NextResponse.json({
      success: false,
      message: 'Authentication validation failed'
    }, { status: 500 });
  }
}
