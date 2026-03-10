import { NextResponse, NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Basic security headers for all routes
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    // Allow access to login page without authentication
    if (pathname === '/admin/login' || pathname === '/admin/forgot-password') {
      // Set a simple CSRF token
      if (!request.cookies.get('csrf-token')) {
        const csrfToken = Math.random().toString(36).substring(2, 15);
        response.cookies.set('csrf-token', csrfToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 // 24 hours
        });
      }
      return response;
    }

    // For all other admin pages, check authentication
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      // Redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    // Simple token validation (basic check)
    try {
      // Check if token matches our expected format
      if (!token.startsWith('prod-jwt-token-')) {
        throw new Error('Invalid token format');
      }

      const tokenParts = token.split('-');
      const timestamp = tokenParts[3];
      
      if (timestamp) {
        const tokenTime = parseInt(timestamp);
        const currentTime = Date.now();
        const isExpired = (currentTime - tokenTime) > 24 * 60 * 60 * 1000; // 24 hours
        
        if (isExpired) {
          throw new Error('Token expired');
        }
      }
    } catch (error) {
      // Clear invalid token and redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.cookies.delete('admin-token');
      redirectResponse.cookies.delete('csrf-token');
      return redirectResponse;
    }

    // Set CSRF token for admin pages
    if (!request.cookies.get('csrf-token')) {
      const csrfToken = Math.random().toString(36).substring(2, 15);
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
    '/admin/:path*'
  ]
};
