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
import { storage, getApiUrl, validateToken } from '@/lib/auth-utils';
import { AdminUser } from '@/types/admin';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    try {
      console.log('Checking admin authentication...');
      
      const token = storage.getToken();
      
      console.log('Token available:', !!token);

      // Validate token format and expiration
      if (!validateToken(token)) {
        console.log('Token invalid or expired, redirecting to login');
        storage.removeToken();
        router.replace('/admin/login');
        return;
      }

      const apiUrl = getApiUrl();
      console.log('Auth validation API URL:', apiUrl);

      const response = await fetch(`${apiUrl}/api/admin/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include'
      });

      console.log('Auth validation response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('Auth validation successful:', userData);
        setUser(userData.user || userData);
        storage.setUser(userData.user || userData);
      } else {
        console.log('Auth validation failed, redirecting to login');
        storage.removeToken();
        router.replace('/admin/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      storage.removeToken();
      router.replace('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const apiUrl = getApiUrl();
      const token = storage.getToken();

      await fetch(`${apiUrl}/api/admin/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      storage.removeToken();
      router.replace('/admin/login');
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // For login page, render children without admin layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!user) {
    // This should not happen as checkAuth should redirect, but as a fallback
    router.replace('/admin/login');
    return null;
  }

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
                    {user?.name}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <div className="font-medium">{user?.name}</div>
                        <div className="text-gray-500">{user?.email}</div>
                        <div className="text-xs text-blue-600">{user?.role}</div>
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

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
