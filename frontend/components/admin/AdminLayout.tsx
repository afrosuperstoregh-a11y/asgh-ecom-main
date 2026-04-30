'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { safeCapitalize } from '@/lib/utils';
import AdminSidebar from './AdminSidebar';
import { Menu, X, LogOut, Bell } from 'lucide-react';
import { tokenManager } from '@/lib/token-manager';
import { AdminUser } from '@/types/admin';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayoutWrapper({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = tokenManager.getToken();
        const userData = tokenManager.getUser();
        
        if (process.env.NODE_ENV === "development") {
          console.log('🚀 [ADMIN_LAYOUT] Authentication check →', pathname);
          console.log('🚀 [ADMIN_LAYOUT] Token exists →', !!token);
          console.log('🚀 [ADMIN_LAYOUT] User data →', userData);
        }

        if (!token) {
          if (pathname !== '/admin/login') {
            router.push('/admin/login');
          }
          setLoading(false);
          setAuthChecked(true);
          return;
        }

        // Validate token
        const isValid = tokenManager.validateToken(token);
        if (!isValid) {
          tokenManager.removeToken();
          if (pathname !== '/admin/login') {
            router.push('/admin/login');
          }
          setLoading(false);
          setAuthChecked(true);
          return;
        }

        setUser(userData);
        setLoading(false);
        setAuthChecked(true);

        // Redirect authenticated users away from login
        if (pathname === '/admin/login' && userData) {
          router.replace('/admin');
        }

      } catch (error) {
        console.error('Auth check error:', error);
        tokenManager.removeToken();
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Handle logout
  const handleLogout = () => {
    tokenManager.removeToken();
    router.push('/admin/login');
  };

  // Don't render anything while checking auth
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render layout on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-gray-600 bg-opacity-75 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isMobile={true} 
      />

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block">
        <AdminSidebar 
          isOpen={true} 
          isMobile={false} 
        />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            {/* Left side - Mobile menu button and title */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="ml-4 lg:ml-0">
                <h1 className="text-lg font-semibold text-gray-900">
                  {title || getPageTitle(pathname)}
                </h1>
              </div>
            </div>

            {/* Right side - User menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                <Bell className="h-5 w-5" />
              </button>

              {/* User dropdown */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin User'}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'admin@afrosuperstore.ca'}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {safeCapitalize(user?.name || 'Admin').charAt(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

// Helper function to get page title from pathname
function getPageTitle(pathname: string): string {
  const pathSegments = pathname.split('/').filter(Boolean);
  
  if (pathname === '/admin' || pathname === '/admin/') {
    return 'Dashboard';
  }
  
  const pageMap: Record<string, string> = {
    'orders': 'Orders',
    'products': 'Products',
    'customers': 'Customers',
    'categories': 'Categories',
    'promotions': 'Promotions',
    'payments': 'Payments',
    'analytics': 'Analytics',
    'features': 'Features',
    'roles': 'Roles',
    'settings': 'Settings',
    'login': 'Admin Login',
    'create': 'Create Product',
    'edit': 'Edit Product'
  };

  const lastSegment = pathSegments[pathSegments.length - 1];
  return pageMap[lastSegment] || 'Admin';
}
