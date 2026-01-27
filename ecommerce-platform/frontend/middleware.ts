import { NextResponse, NextRequest } from 'next/server';
import { createHash, randomBytes } from 'crypto';

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window
const LOGIN_RATE_LIMIT_MAX = 5; // login attempts per window

function getRateLimitKey(ip: string, endpoint?: string) {
  return endpoint ? `rate_limit:${ip}:${endpoint}` : `rate_limit:${ip}`;
}

function isRateLimited(ip: string, maxRequests: number, endpoint?: string): boolean {
  const key = getRateLimitKey(ip, endpoint);
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

// CSRF token validation
function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
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

  // Constant-time comparison to prevent timing attacks
  if (token.length !== cookieToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }

  return result === 0;
}

// JWT validation (simplified - in production, use proper JWT library)
function validateJWTToken(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    // This is a simplified validation
    // In production, you should verify the signature against your JWT_SECRET
    // and validate expiration, issuer, etc.
    
    if (!token || token.length < 10) {
      return { valid: false, error: 'Invalid token format' };
    }

    // For now, we'll validate token format and check if it looks like a JWT
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid JWT structure' };
    }

    // Decode payload (without signature verification for now)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }

    // Check if user has admin role
    if (!payload.role || !['ADMIN', 'SUPER_ADMIN'].includes(payload.role)) {
      return { valid: false, error: 'Insufficient permissions' };
    }

    return { valid: true, payload };
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
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Required for Next.js dev
      "style-src 'self' 'unsafe-inline'", // Required for Tailwind
      "img-src 'self' data: https: http:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'"
    ].join('; ')
  );

  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    // Rate limiting for admin routes
    if (isRateLimited(ip, RATE_LIMIT_MAX_REQUESTS, 'admin')) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }

    // Allow access to login page and login API
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

      // Validate CSRF for mutating API requests
      if (!validateCSRFToken(request)) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Invalid CSRF token' }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Check authentication for API routes
      const token = request.cookies.get('auth-token')?.value || 
                   request.headers.get('authorization')?.replace('Bearer ', '');

      if (!token) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Authentication required' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const validation = validateJWTToken(token);
      if (!validation.valid) {
        return new NextResponse(
          JSON.stringify({ 
            success: false, 
            message: validation.error || 'Invalid authentication' 
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Add user info to request headers for downstream use
      response.headers.set('x-user-id', validation.payload.id);
      response.headers.set('x-user-role', validation.payload.role);
      response.headers.set('x-user-email', validation.payload.email);

      return response;
    }

    // For all other admin pages, check authentication
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      // Redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const validation = validateJWTToken(token);
    if (!validation.valid) {
      // Clear invalid token and redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
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
