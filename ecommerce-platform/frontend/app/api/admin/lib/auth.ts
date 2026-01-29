import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

// Authentication middleware for admin routes
export async function authenticateAdmin() {
  const cookieStore = await cookies();
  
  // Debug: Log all available cookies
  const allCookies = cookieStore.getAll();
  console.log('🍪 Available cookies:', allCookies.map(c => c.name));
  
  // Try multiple possible cookie names
  const accessToken = 
    cookieStore.get('supabase-auth-token')?.value ||
    cookieStore.get('sb-access-token')?.value ||
    cookieStore.get('access_token')?.value;
  
  console.log('🔑 Access token found:', !!accessToken);
  
  if (!accessToken) {
    console.log('❌ No authentication token provided');
    return { error: 'No authentication token provided', status: 401 };
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error) {
      console.log('❌ Supabase auth error:', error.message);
      return { error: 'Invalid or expired authentication token', status: 401 };
    }

    if (!data.user) {
      console.log('❌ No user found in token');
      return { error: 'Invalid or expired authentication token', status: 401 };
    }

    console.log('✅ User authenticated:', data.user.email);

    // Check if user has admin role
    const userRole = data.user.user_metadata?.role || data.user.user_metadata?.user_type;
    console.log('👤 User role:', userRole);
    
    if (!['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      console.log('❌ Insufficient permissions for role:', userRole);
      return { error: 'Insufficient permissions', status: 403 };
    }

    console.log('✅ Admin authentication successful');
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
    console.error('❌ Authentication error:', error);
    return { error: 'Authentication failed', status: 401 };
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
