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
  Database,
  Shield,
  Plus
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
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

  // Single auth initialization effect - handles all auth logic
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log('🚀 [LAYOUT] Layout render →', pathname);
      console.log('🚀 [LAYOUT] User value →', user);
      console.log('🚀 [LAYOUT] Page mount →', pathname);
    }
    
    // Skip auth check for login page - let it render immediately without layout
    if (pathname === '/admin/login') {
    if (process.env.NODE_ENV === "development") {
      console.log('🚀 [LAYOUT] Login page detected, skipping auth check');
    }
      setLoading(false);
      setAuthChecked(true);
      return;
    }

    // For all other pages, perform auth check immediately
    performAuthCheck();
  }, [pathname]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && pathname !== '/admin/login' && authChecked) {
      if (process.env.NODE_ENV === "development") {
        console.log('🚀 [LAYOUT] No user found, redirecting to login');
      }
      router.push('/admin/login');
    }
  }, [user, pathname, authChecked, router]);

  // Also redirect to dashboard if user is authenticated but on login page
  useEffect(() => {
    if (user && pathname === '/admin/login' && authChecked) {
      if (process.env.NODE_ENV === "development") {
        console.log('🚀 [LAYOUT] User authenticated on login page, redirecting to dashboard');
      }
      router.replace('/admin');
    }
  }, [user, pathname, authChecked, router]);

  // Auth check function - consolidated auth logic
  const performAuthCheck = async () => {
    try {
    if (process.env.NODE_ENV === "development") {
      console.log('🚀 [AUTH] Starting authentication check...');
    }
      logger.info('Checking admin authentication...');
      
      // Get admin token
      const token = tokenManager.getToken();
      const userData = tokenManager.getUser();
      
      if (process.env.NODE_ENV === "development") {
        console.log('🚀 [AUTH] Token from manager:', token);
        console.log('🚀 [AUTH] User data from manager:', userData);
        console.log('🚀 [AUTH] Token validation result:', token ? tokenManager.validateToken(token) : 'No token to validate');
      }
      
      if (!token || !userData) {
    if (process.env.NODE_ENV === "development") {
      console.log('🚀 [AUTH] No token or user data found');
      console.log('🚀 [AUTH] Token exists:', !!token);
      console.log('🚀 [AUTH] User data exists:', !!userData);
    }
        logger.info('No token found');
        setLoading(false);
        setAuthChecked(true);
        router.push('/admin/login');
        return;
      }

    if (process.env.NODE_ENV === "development") {
      console.log('🚀 [AUTH] Token found, validating...');
    }
      
      // Validate token format
      // The token manager handles validation internally
      if (!tokenManager.validateToken(token)) {
    if (process.env.NODE_ENV === "development") {
      console.log('🚀 [AUTH] Invalid token, redirecting to login');
    }
        logger.info('Invalid token');
        tokenManager.removeToken();
        setLoading(false);
        setAuthChecked(true);
        router.push('/admin/login');
        return;
      }

    if (process.env.NODE_ENV === "development") {
      console.log('🚀 [AUTH] Authentication successful');
      console.log('🚀 [AUTH] Setting user data:', userData);
    }
      
      // Set user data
      setUser(userData);
      setLoading(false);
      setAuthChecked(true);
      
      logger.info('Admin authentication successful');
    } catch (error) {
      console.error('🚀 [AUTH] Auth check error:', error);
      logger.error('Authentication check failed');
      tokenManager.removeToken();
      setLoading(false);
      setAuthChecked(true);
      router.push('/admin/login');
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      tokenManager.removeToken();
      setUser(null);
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Loading state
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render layout for login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Don't render if user is not authenticated (will redirect in useEffect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, current: pathname === '/admin' || pathname === '/admin/' },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, current: pathname === '/admin/orders' },
    { 
      name: 'Products', 
      href: '/admin/products', 
      icon: Package, 
      current: pathname.startsWith('/admin/products'),
      subItems: [
        { name: 'All Products', href: '/admin/products' },
        { name: 'Add Product', href: '/admin/products/create' }
      ]
    },
    { name: 'Customers', href: '/admin/customers', icon: Users, current: pathname === '/admin/customers' },
    { name: 'Categories', href: '/admin/categories', icon: Tag, current: pathname === '/admin/categories' },
    { name: 'Promotions', href: '/admin/promotions', icon: FileText, current: pathname === '/admin/promotions' },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard, current: pathname === '/admin/payments' },
    { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp, current: pathname === '/admin/analytics' },
    { name: 'Features', href: '/admin/features', icon: Database, current: pathname === '/admin/features' },
    { name: 'Roles', href: '/admin/roles', icon: Shield, current: pathname === '/admin/roles' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, current: pathname === '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <div className="flex items-center">
              <Store className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Admin</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-8 px-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const hasSubItems = item.subItems && item.subItems.length > 0;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        item.current
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                    
                    {/* Sub-items for Products */}
                    {hasSubItems && item.current && (
                      <ul className="mt-1 ml-4 space-y-1">
                        {item.subItems?.map((subItem) => {
                          const subActive = pathname === subItem.href;
                          return (
                            <li key={subItem.name}>
                              <Link
                                href={subItem.href}
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                                  subActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }`}
                                onClick={() => setSidebarOpen(false)}
                              >
                                {subItem.name === 'Add Product' && <Plus className="mr-2 h-4 w-4" />}
                                {subItem.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex items-center h-16 px-4 border-b">
          <Store className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">Admin</span>
        </div>
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      item.current
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                  
                  {/* Sub-items for Products */}
                  {hasSubItems && item.current && (
                    <ul className="mt-1 ml-4 space-y-1">
                      {item.subItems?.map((subItem) => {
                        const subActive = pathname === subItem.href;
                        return (
                          <li key={subItem.name}>
                            <Link
                              href={subItem.href}
                              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                                subActive
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                              }`}
                            >
                              {subItem.name === 'Add Product' && <Plus className="mr-2 h-4 w-4" />}
                              {subItem.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 text-sm rounded-lg p-2 hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {(user?.name ? user.name.charAt(0).toUpperCase() : 'A')}
                    </span>
                  </div>
                  <span className="font-medium text-gray-700">{user?.name}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      href="/admin/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
