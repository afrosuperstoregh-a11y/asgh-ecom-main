import { NextRequest, NextResponse } from 'next/server';

// Shared token validation logic
export function validateTokenFormat(token: string): boolean {
  if (!token.startsWith('prod-jwt-token-')) {
    return false;
  }

  const tokenParts = token.split('-');
  const timestamp = tokenParts[3];
  
  if (timestamp) {
    const tokenTime = parseInt(timestamp);
    const currentTime = Date.now();
    const isExpired = (currentTime - tokenTime) > 24 * 60 * 60 * 1000; // 24 hours
    
    if (isExpired) {
      return false;
    }
  }
  
  return true;
}

// Validate admin token server-side
export async function validateAdminToken(request: NextRequest): Promise<{ valid: boolean; user?: any }> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return { valid: false };
    }

    if (validateTokenFormat(token)) {
      return {
        valid: true,
        user: {
          id: 'admin-001',
          email: 'info@afrosuperstore.ca',
          name: 'Super Admin',
          role: 'super_admin',
          permissions: ['read', 'write', 'delete', 'admin', 'super_admin']
        }
      };
    }

    return { valid: false };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false };
  }
}

// Server-side auth middleware for API routes
export async function withAuth(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    const validation = await validateAdminToken(request);
    
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    (request as any).user = validation.user;
    return handler(request, context);
  };
}
