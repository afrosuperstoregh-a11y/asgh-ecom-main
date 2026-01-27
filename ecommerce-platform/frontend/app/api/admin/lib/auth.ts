import { cookies } from 'next/headers';

// Authentication middleware for admin routes
export async function authenticateAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) {
    return { error: 'No token provided', status: 401 };
  }

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { error: 'Token expired', status: 401 };
    }

    if (!payload.role || !['ADMIN', 'SUPER_ADMIN'].includes(payload.role)) {
      return { error: 'Insufficient permissions', status: 403 };
    }

    return { user: payload };
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
}

// Helper function to create authenticated API responses
export function createAuthErrorResponse(error: string, status: number) {
  return {
    success: false,
    message: error
  };
}

export function createSuccessResponse(data: any) {
  return {
    success: true,
    data
  };
}
