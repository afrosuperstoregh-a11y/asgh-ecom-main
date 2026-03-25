'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
  Store,
  FileText,
  TrendingUp,
  Database,
  Shield,
  Plus,
  ChevronRight
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { 
    name: 'Products', 
    href: '/admin/products', 
    icon: Package,
    subItems: [
      { name: 'All Products', href: '/admin/products' },
      { name: 'Add Product', href: '/admin/products/create' }
    ]
  },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Categories', href: '/admin/categories', icon: Tag },
  { name: 'Promotions', href: '/admin/promotions', icon: FileText },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
  { name: 'Features', href: '/admin/features', icon: Database },
  { name: 'Roles', href: '/admin/roles', icon: Shield },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar({ isOpen = true, onClose, isMobile = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href || pathname === '/admin/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isSubActive = (href: string) => {
    return pathname === href;
  };

  const sidebarClasses = `
    ${isMobile 
      ? `fixed inset-y-0 left-0 z-50 w-[240px] min-w-[220px] max-w-[280px] bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`
      : `hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 ${collapsed ? 'lg:w-20' : 'lg:w-[240px] lg:min-w-[220px] lg:max-w-[280px]'} lg:bg-white lg:border-r lg:border-gray-200 lg:block`
    }
  `;

  return (
    <div className={sidebarClasses}>
      {/* Sidebar Header */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mr-2 p-1 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center">
          <Store className="h-8 w-8 text-blue-600 flex-shrink-0" />
          {!collapsed && (
            <span className="ml-2 text-xl font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">Admin</span>
          )}
        </div>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 whitespace-nowrap overflow-hidden ${
                    active
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-black`}
                  onClick={() => {
                    if (isMobile && onClose) {
                      onClose();
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 overflow-hidden text-ellipsis">{item.name}</span>
                      {hasSubItems && (
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:rotate-90" />
                      )}
                    </>
                  )}
                </Link>
                
                {/* Sub-items for Products - Always visible */}
                {hasSubItems && !collapsed && (
                  <ul className="mt-1 pl-6 space-y-2">
                    {item.subItems?.map((subItem) => {
                      const subActive = isSubActive(subItem.href);
                      return (
                        <li key={subItem.name}>
                          <Link
                            href={subItem.href}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 whitespace-nowrap overflow-hidden ${
                              subActive
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            } focus:outline-none focus:ring-2 focus:ring-black`}
                            onClick={() => {
                              if (isMobile && onClose) {
                                onClose();
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            title={collapsed ? subItem.name : undefined}
                          >
                            {subItem.name === 'Add Product' && <Plus className="mr-2 h-4 w-4 flex-shrink-0" />}
                            <span className="overflow-hidden text-ellipsis">{subItem.name}</span>
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

      {/* Footer - Removed user info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        {/* User info removed - now only in header */}
      </div>
    </div>
  );
}
