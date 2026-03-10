/**
 * CRM Dashboard Component
 * Main CRM dashboard with analytics and overview
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Mail, 
  Zap, 
  DollarSign,
  ShoppingCart,
  Calendar,
  Target,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle
} from 'lucide-react';

const CRMDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  // Fetch CRM analytics
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const [dashboardData, lifecycleData, emailData] = await Promise.all([
        fetch(`/api/crm/analytics/dashboard?dateRange=${dateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/crm/analytics/lifecycle?dateRange=${dateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/crm/email/analytics?dateRange=${dateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (dashboardData.ok && lifecycleData.ok && emailData.ok) {
        setAnalytics({
          dashboard: await dashboardData.json(),
          lifecycle: await lifecycleData.json(),
          email: await emailData.json()
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { dashboard, lifecycle, email } = analytics?.data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Dashboard</h1>
          <p className="text-gray-600">Overview of customer relationship management metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{dashboard?.totalCustomers || 0}</p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">+12%</span>
                <span className="text-xs text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Customers</p>
              <p className="text-2xl font-bold text-gray-900">{dashboard?.newCustomers || 0}</p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">+8%</span>
                <span className="text-xs text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard?.totalRevenue || 0)}</p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">+15%</span>
                <span className="text-xs text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Customer Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard?.avgCustomerValue || 0)}</p>
              <div className="flex items-center mt-1">
                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                <span className="text-xs text-red-500">-2%</span>
                <span className="text-xs text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Target className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Lifecycle Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Customer Lifecycle</h2>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {lifecycle?.lifecycleStages && Object.entries(lifecycle.lifecycleStages).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    stage === 'active' ? 'bg-green-500' :
                    stage === 'lead' ? 'bg-blue-500' :
                    stage === 'vip' ? 'bg-purple-500' :
                    stage === 'inactive' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <span className="text-sm font-medium capitalize">{stage}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold">{count}</span>
                  <span className="text-xs text-gray-500">
                    ({formatPercentage(count / (dashboard?.totalCustomers || 1))})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Performance Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Email Performance</h2>
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Sent</span>
              <span className="text-sm font-semibold">{email?.total || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Delivered</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold">{email?.delivered || 0}</span>
                <span className="text-xs text-green-600">
                  ({formatPercentage((email?.delivered || 0) / (email?.total || 1))})
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Opened</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold">{email?.opened || 0}</span>
                <span className="text-xs text-blue-600">
                  ({formatPercentage((email?.opened || 0) / (email?.delivered || 1))})
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Clicked</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold">{email?.clicked || 0}</span>
                <span className="text-xs text-purple-600">
                  ({formatPercentage((email?.clicked || 0) / (email?.opened || 1))})
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Failed</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-red-600">{email?.failed || 0}</span>
                <span className="text-xs text-red-600">
                  ({formatPercentage((email?.failed || 0) / (email?.total || 1))})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Customers</h2>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {/* This would be populated with actual recent customer data */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-gray-500">john@example.com</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">New</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Jane Smith</p>
                <p className="text-xs text-gray-500">jane@example.com</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">Active</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Bob Johnson</p>
                <p className="text-xs text-gray-500">bob@example.com</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">VIP</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Automations */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Automations</h2>
            <Zap className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Welcome Email</p>
                  <p className="text-xs text-gray-500">New customer signup</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">10 min ago</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Order Confirmation</p>
                  <p className="text-xs text-gray-500">Order #12345 placed</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">1 hour ago</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Activity className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Inactive Follow-up</p>
                  <p className="text-xs text-gray-500">30 days inactive</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
            <Users className="h-4 w-4 mr-2" />
            View Customers
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
            <Mail className="h-4 w-4 mr-2" />
            Email Campaign
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">
            <Zap className="h-4 w-4 mr-2" />
            Create Automation
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;
