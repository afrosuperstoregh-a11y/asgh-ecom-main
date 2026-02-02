'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  AlertTriangle,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { logger } from '../../lib/logger';
import AdminDebug from '../../components/admin/AdminDebug';

interface DashboardStats {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    pendingOrders: number;
  };
  growth: {
    orders: number;
    revenue: number;
  };
  currentMonth: {
    orders: number;
    revenue: number;
  };
  recentOrders: any[];
  topProducts: any[];
  lowStockProducts: any[];
}

export default function AdminDashboard() {
  console.log('🔍 [DEBUG] AdminDashboard component rendering...');
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canFetch, setCanFetch] = useState(false);

  useEffect(() => {
    console.log('🔍 [DEBUG] AdminDashboard component mounted');
    logger.log('AdminDashboard component mounted');
    
    // Wait a tick to ensure layout authentication is complete
    const timer = setTimeout(() => {
      setCanFetch(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only fetch data when we're allowed to (after auth is complete)
    if (canFetch) {
      console.log('🔍 [DEBUG] Authentication confirmed, fetching dashboard data...');
      fetchDashboardData();
    }
  }, [canFetch]);

  const fetchDashboardData = async () => {
    try {
      console.log('🔍 [DEBUG] Starting dashboard data fetch...');
      logger.log('Fetching dashboard data...');
      
      // Use the API configuration from lib/api.js
      const { api } = await import('../../lib/api.js');
      console.log('🔍 [DEBUG] API module loaded');
      
      const data = await api.getDashboard();
      console.log('🔍 [DEBUG] Dashboard API response:', data);
      logger.log('Dashboard data received successfully');
      
      // Map backend data structure to frontend expectations
      const mappedData = {
        overview: {
          totalOrders: data.data?.stats?.totalOrders || 0,
          totalRevenue: data.data?.stats?.totalRevenue || 0,
          totalCustomers: data.data?.stats?.totalUsers || 0,
          totalProducts: data.data?.stats?.totalProducts || 0,
          pendingOrders: 0 // TODO: Add pending orders query
        },
        growth: {
          orders: 0, // TODO: Add growth calculations
          revenue: 0 // TODO: Add growth calculations
        },
        currentMonth: {
          orders: data.data?.stats?.totalOrders || 0,
          revenue: data.data?.stats?.totalRevenue || 0
        },
        recentOrders: data.data?.recentOrders?.map((order: any) => ({
          id: order.order_number,
          orderNumber: order.order_number,
          total: order.total_amount,
          status: order.status,
          user: { name: order.email, email: order.email },
          createdAt: order.created_at
        })) || [],
        topProducts: [], // TODO: Add top products query
        lowStockProducts: [] // TODO: Add low stock products query
      };
      
      setStats(mappedData);
    } catch (error: any) {
      console.error('🔍 [DEBUG] Dashboard fetch error:', error);
      logger.auth('Dashboard data fetch failed', false, error?.message);
      
      // Handle 401 errors specifically
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        setError('Your session has expired. Please log in again.');
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
      } else {
        setError('Failed to fetch dashboard data: ' + (error?.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon,
    color = 'blue'
  }: {
    title: string;
    value: string | number;
    change?: number;
    changeType?: 'increase' | 'decrease';
    icon: any;
    color?: string;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500'
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]} bg-opacity-10`}>
            <Icon className={`h-6 w-6 text-${color}-500`} />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center text-sm ${
                changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {changeType === 'increase' ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                {Math.abs(change)}% from last month
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!canFetch) {
    console.log('🔍 [DEBUG] Dashboard waiting for authentication...');
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-center text-gray-500 mt-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    console.log('🔍 [DEBUG] Dashboard is in loading state');
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    console.log('🔍 [DEBUG] Dashboard in error state:', { error, hasStats: !!stats });
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error || 'Failed to load dashboard data'}</p>
        </div>
      </div>
    );
  }

  console.log('🔍 [DEBUG] Dashboard rendering with stats:', stats);

  return (
    <div className="p-6">
      {typeof window !== 'undefined' && <AdminDebug />}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.overview.totalRevenue)}
          change={stats.growth.revenue}
          changeType={stats.growth.revenue >= 0 ? 'increase' : 'decrease'}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Orders"
          value={stats.overview.totalOrders.toLocaleString()}
          change={stats.growth.orders}
          changeType={stats.growth.orders >= 0 ? 'increase' : 'decrease'}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Total Customers"
          value={stats.overview.totalCustomers.toLocaleString()}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Total Products"
          value={stats.overview.totalProducts.toLocaleString()}
          icon={Package}
          color="yellow"
        />
      </div>

      {/* Alert for pending orders */}
      {stats.overview.pendingOrders > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-8">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">
              You have <span className="font-semibold">{stats.overview.pendingOrders}</span> pending orders
              requiring attention.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <div className="overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {stats.recentOrders.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No recent orders
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {stats.recentOrders.map((order) => (
                    <div key={order.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {order.orderNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.user?.name || order.guestEmail}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(Number(order.total))}
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                            order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
          </div>
          <div className="overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {stats.topProducts.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No product data available
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {stats.topProducts.map((item, index) => (
                    <div key={item.productId} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {index + 1}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {item.product?.name || 'Unknown Product'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.product?.sku || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(Number(item._sum.total))}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item._count.total} sold
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-red-900">Low Stock Alert</h2>
          </div>
          <div className="overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {stats.lowStockProducts.map((variant) => (
                  <div key={variant.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {variant.product?.name || 'Unknown Product'}
                        </p>
                        <p className="text-sm text-gray-500">
                          SKU: {variant.sku}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          variant.stock <= 5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {variant.stock} units
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
