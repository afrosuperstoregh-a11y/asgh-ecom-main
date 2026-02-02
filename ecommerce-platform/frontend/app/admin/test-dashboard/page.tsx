'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  ShoppingCart,
  Package,
  DollarSign
} from 'lucide-react';

export default function TestDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test with mock data first
    const mockData = {
      overview: {
        totalOrders: 156,
        totalRevenue: 45780.50,
        totalCustomers: 89,
        totalProducts: 234,
        pendingOrders: 0
      },
      growth: {
        orders: 12,
        revenue: 8
      },
      currentMonth: {
        orders: 156,
        revenue: 45780.50
      },
      recentOrders: [],
      topProducts: [],
      lowStockProducts: []
    };
    
    setTimeout(() => {
      setStats(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }: any) => {
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
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
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
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error || 'Failed to load dashboard data'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Test Dashboard</h1>
        <p className="text-gray-600 mt-2">This is a test dashboard without authentication</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.overview.totalRevenue)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Orders"
          value={stats.overview.totalOrders.toLocaleString()}
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

      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <p className="text-green-800">✅ Dashboard component rendered successfully!</p>
      </div>
    </div>
  );
}
