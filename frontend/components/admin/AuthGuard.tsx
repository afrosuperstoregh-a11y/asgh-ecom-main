'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tokenManager } from '../../lib/token-manager';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      console.log('🔍 [DEBUG] AuthGuard: Checking authentication...');
      const token = tokenManager.getToken();
      
      console.log('🔍 [DEBUG] AuthGuard: Token available:', !!token);
      
      if (!token) {
        console.log('🔍 [DEBUG] AuthGuard: No token found, redirecting to login');
        router.replace('/admin/login');
        return;
      }

      // Use centralized token validation
      if (tokenManager.validateToken(token)) {
        console.log('🔍 [DEBUG] AuthGuard: Token validation successful');
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        console.log('🔍 [DEBUG] AuthGuard: Invalid token format, redirecting to login');
        tokenManager.removeToken();
        router.replace('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Show a brief loading state while redirecting
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
