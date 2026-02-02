'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Store,
  FileText,
  TrendingUp,
  Database
} from 'lucide-react';
import { tokenManager } from '@/lib/token-manager';
import { AdminUser } from '@/types/admin';
import { logger } from '@/lib/logger';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // KEY STEP 1: Single auth initialization effect - handles all auth logic
  useEffect(() => {
    console.log('🚀 [LAYOUT] Layout render →', pathname);
    console.log('🚀 [LAYOUT] Token value →', tokenManager.getToken());
    console.log('🚀 [LAYOUT] User value →', user);
    console.log('🚀 [LAYOUT] Page mount →', pathname);
    
    // Skip auth check for login page - let it render immediately without layout
    if (pathname === '/admin/login') {
      console.log('🚀 [LAYOUT] Login page detected, skipping auth check');
      setLoading(false);
      setAuthChecked(true);
      return;
    }

    // For all other pages, perform auth check
    performAuthCheck();
  }, [pathname]);

  // KEY STEP 2: Auth check function - consolidated auth logic
  const performAuthCheck = async () => {
    try {
      console.log('🚀 [AUTH] Starting authentication check...');
      logger.log('Checking admin authentication...');
      
      const token = tokenManager.getToken();
      
      if (!token) {
        console.log('🚀 [AUTH] No token found');
        logger.log('No token found');
        setLoading(false);
        setAuthChecked(true);
        return;
      }

      // Validate token format and expiration
      if (!tokenManager.validateToken(token)) {
        console.log('🚀 [AUTH] Token invalid or expired');
        logger.log('Token invalid or expired');
        tokenManager.removeToken();
        setLoading(false);
        setAuthChecked(true);
        return;
      }

      console.log('🚀 [AUTH] Token valid, fetching user data...');
      
      // Fetch user data from auth endpoint
      const response = await fetch('/api/admin/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('🚀 [AUTH] User data received:', userData.user || userData);
        logger.log('Authentication successful');
        setUser(userData.user || userData);
        tokenManager.setUser(userData.user || userData);
      } else {
        console.log('🚀 [AUTH] Auth failed, status:', response.status);
        logger.log('Authentication failed');
        tokenManager.removeToken();
      }
    } catch (error: any) {
      console.error('🚀 [AUTH] Auth check error:', error);
      logger.auth('Auth check failed', false, error?.message);
      tokenManager.removeToken();
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  // KEY STEP 3: Redirect effect - ONLY handles redirects after auth is complete
  useEffect(() => {
    // Only redirect if:
    // 1. Auth check is complete
    // 2. Loading is finished
    // 3. No user found (auth failed)
    // 4. Not already on login page
    if (authChecked && !loading && !user && pathname !== '/admin/login') {
      console.log('🚀 [LAYOUT] Redirecting to login - no user found');
      router.replace('/admin/login');
    }
  }, [authChecked, loading, user, pathname, router]);

  // KEY STEP 4: Logout function
  const handleLogout = async () => {
    try {
      const token = tokenManager.getToken();
      
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include'
      });
    } catch (error: any) {
      logger.auth('Logout error', false, error?.message);
    } finally {
      tokenManager.removeToken();
      router.replace('/admin/login');
    }
  };

  // Navigation configuration
  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: pathname === '/admin'
    },
    {
      name: 'Products',
      href: '/admin/products',
      icon: Package,
      current: pathname?.startsWith('/admin/products') || false
    },
    {
      name: 'Orders',
      href: '/admin/orders',
      icon: ShoppingCart,
      current: pathname?.startsWith('/admin/orders') || false
    },
    {
      name: 'Customers',
      href: '/admin/customers',
      icon: Users,
      current: pathname?.startsWith('/admin/customers') || false
    },
    {
      name: 'Categories',
      href: '/admin/categories',
      icon: Store,
      current: pathname?.startsWith('/admin/categories') || false
    },
    {
      name: 'Promotions',
      href: '/admin/promotions',
      icon: Tag,
      current: pathname?.startsWith('/admin/promotions') || false
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: TrendingUp,
      current: pathname?.startsWith('/admin/analytics') || false
    },
    {
      name: 'Payments',
      href: '/admin/payments',
      icon: CreditCard,
      current: pathname?.startsWith('/admin/payments') || false
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      current: pathname?.startsWith('/admin/settings') || false
    },
    {
      name: 'Features',
      href: '/admin/features',
      icon: Database,
      current: pathname?.startsWith('/admin/features') || false
    }
  ];

  // KEY STEP 5: Loading state - shows spinner while auth is being checked
  if (loading || !authChecked) {
    console.log('🚀 [LAYOUT] Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // KEY STEP 6: Login page - render without admin layout
  if (pathname === '/admin/login') {
    console.log('🚀 [LAYOUT] Rendering login page without layout');
    return <>{children}</>;
  }

  // KEY STEP 7: Admin layout - render full dashboard for authenticated users only
  if (!user) {
    console.log('🚀 [LAYOUT] No user found, showing loading while redirecting');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  console.log('🚀 [LAYOUT] Rendering admin layout for authenticated user');
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-4 border-b">
            <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 bg-white border-b border-gray-200">
          <button
            type="button"
            className="lg:hidden px-4 text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 flex justify-between items-center px-4 lg:px-6">
            <div className="flex-1" />
            
            <div className="ml-4 flex items-center md:ml-6">
              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <span className="ml-2 text-gray-700 font-medium hidden md:block">
                    {user?.name || 'Admin'}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <div className="font-medium">{user?.name || 'Admin User'}</div>
                        <div className="text-gray-500">{user?.email || 'admin@example.com'}</div>
                        <div className="text-xs text-blue-600">{user?.role || 'Administrator'}</div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="inline h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content - this is where dashboard pages mount */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
