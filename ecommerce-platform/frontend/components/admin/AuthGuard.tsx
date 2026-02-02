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
      const token = tokenManager.getToken();
      
      if (!token) {
        console.log('🔍 [DEBUG] No token found, redirecting to login');
        router.replace('/admin/login');
        return;
      }

      // Use centralized token validation
      if (tokenManager.validateToken(token)) {
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        console.log('🔍 [DEBUG] Invalid token format, redirecting to login');
        tokenManager.removeToken();
        router.replace('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
