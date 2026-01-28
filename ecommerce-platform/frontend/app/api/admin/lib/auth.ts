import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

// Authentication middleware for admin routes
export async function authenticateAdmin() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('supabase-auth-token')?.value;
  
  if (!accessToken) {
    return { error: 'No authentication token provided', status: 401 };
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data.user) {
      return { error: 'Invalid or expired authentication token', status: 401 };
    }

    // Check if user has admin role
    const userRole = data.user.user_metadata?.role || data.user.user_metadata?.user_type;
    if (!['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return { error: 'Insufficient permissions', status: 403 };
    }

    return { 
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
        role: userRole,
        emailVerified: data.user.email_confirmed_at != null
      }
    };
  } catch (error) {
    return { error: 'Invalid authentication token', status: 401 };
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
