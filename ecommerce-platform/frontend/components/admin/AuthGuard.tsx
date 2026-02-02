'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '../../lib/auth-utils';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = storage.getToken();
      
      if (!token) {
        console.log('🔍 [DEBUG] No token found, redirecting to login');
        router.replace('/admin/login');
        return;
      }

      // Validate token format and expiration
      if (token.startsWith('prod-jwt-token-')) {
        const tokenParts = token.split('-');
        const timestamp = tokenParts[3];
        
        if (timestamp) {
          const tokenTime = parseInt(timestamp);
          const currentTime = Date.now();
          const isExpired = (currentTime - tokenTime) > 24 * 60 * 60 * 1000; // 24 hours
          
          if (isExpired) {
            console.log('🔍 [DEBUG] Token expired, redirecting to login');
            storage.removeToken();
            router.replace('/admin/login');
            return;
          }
        }
        
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        console.log('🔍 [DEBUG] Invalid token format, redirecting to login');
        storage.removeToken();
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
