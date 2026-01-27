import { NextResponse, NextRequest } from 'next/server';

// Simple in-memory rate limiting for middleware
const rateLimitStore = new Map();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100;
const LOGIN_RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string, maxRequests: number, endpoint?: string): boolean {
  const key = endpoint ? `${ip}:${endpoint}` : ip;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Clean old entries
  for (const [k, data] of rateLimitStore.entries()) {
    if (data.windowStart < windowStart) {
      rateLimitStore.delete(k);
    }
  }

  const record = rateLimitStore.get(key);
  if (!record) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (record.windowStart < windowStart) {
    record.count = 1;
    record.windowStart = now;
    return false;
  }

  record.count++;
  return record.count > maxRequests;
}

function generateCSRFToken(): string {
  // Simple CSRF token generation
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function validateCSRFToken(request: NextRequest): boolean {
  const method = request.method;
  
  // Only validate CSRF for state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return true;
  }

  const token = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('csrf-token')?.value;

  if (!token || !cookieToken) {
    return false;
  }

  // Simple comparison (for production, use constant-time comparison)
  return token === cookieToken;
}

// Simple JWT validation (for middleware only - full validation in API)
function validateJWTTokenSimple(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    if (!token || token.length < 10) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Basic JWT structure check
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid JWT structure' };
    }

    // Decode payload without signature verification (API will do full validation)
    try {
      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, error: 'Token expired' };
      }

      // Check if user has admin role
      if (!payload.role || !['ADMIN', 'SUPER_ADMIN'].includes(payload.role)) {
        return { valid: false, error: 'Insufficient permissions' };
      }

      return { valid: true, payload };
    } catch (decodeError) {
      return { valid: false, error: 'Invalid token payload' };
    }
  } catch (error) {
    return { valid: false, error: 'Token validation failed' };
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // Security headers
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (simplified for compatibility)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
    );
  }

  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    // Rate limiting for admin routes
    if (isRateLimited(ip, RATE_LIMIT_MAX_REQUESTS, 'admin')) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }

    // Allow access to login and forgot-password pages
    if (pathname === '/admin/login' || pathname === '/admin/forgot-password') {
      // Set CSRF token for login form
      if (!request.cookies.get('csrf-token')) {
        const csrfToken = generateCSRFToken();
        response.cookies.set('csrf-token', csrfToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 // 24 hours
        });
      }
      return response;
    }

    // API routes need special handling
    if (pathname.startsWith('/api/admin')) {
      // Rate limiting for login API
      if (pathname.includes('/auth/login')) {
        if (isRateLimited(ip, LOGIN_RATE_LIMIT_MAX, 'login')) {
          return new NextResponse(
            JSON.stringify({ success: false, message: 'Too many login attempts. Please try again later.' }),
            { 
              status: 429,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }

      // Validate CSRF for mutating API requests (but be lenient during development)
      if (process.env.NODE_ENV === 'production' && !validateCSRFToken(request)) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Invalid CSRF token' }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // For now, skip authentication validation in middleware to avoid 500 errors
      // Let the API routes handle authentication themselves
      return response;
    }

    // For all other admin pages, check authentication
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      // Redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    // Simple token validation
    const validation = validateJWTTokenSimple(token);
    if (!validation.valid) {
      // Clear invalid token and redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.cookies.delete('auth-token');
      redirectResponse.cookies.delete('csrf-token');
      return redirectResponse;
    }

    // Set CSRF token for admin pages
    if (!request.cookies.get('csrf-token')) {
      const csrfToken = generateCSRFToken();
      response.cookies.set('csrf-token', csrfToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 24 hours
      });
    }

    return response;
  }

  // Non-admin routes - allow access
  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
};
