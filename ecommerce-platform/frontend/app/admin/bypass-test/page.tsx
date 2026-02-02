'use client';

import { useState, useEffect } from 'react';

export default function BypassTestDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 [DEBUG] BypassTestDashboard component mounted');
    
    // Test API call without authentication
    const testApiCall = async () => {
      try {
        console.log('🔍 [DEBUG] Testing dashboard API without auth...');
        
        const response = await fetch('/api/admin/dashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('🔍 [DEBUG] API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 [DEBUG] API Response data:', data);
          setStats(data.data);
        } else {
          const errorData = await response.json();
          console.log('🔍 [DEBUG] API Error:', errorData);
          setError(`API Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }
      } catch (err: any) {
        console.error('🔍 [DEBUG] API Call failed:', err);
        setError(`Network Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    testApiCall();
  }, []);

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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
        <div className="mt-4">
          <p className="text-gray-600">This error shows the API requires authentication.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bypass Test Dashboard</h1>
        <p className="text-gray-600 mt-2">Testing dashboard without authentication layout</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500 bg-opacity-10">
                <div className="h-6 w-6 text-green-500">$</div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">${stats.stats?.totalRevenue?.toLocaleString() || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-500 bg-opacity-10">
                <div className="h-6 w-6 text-blue-500">📦</div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.stats?.totalOrders?.toLocaleString() || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-500 bg-opacity-10">
                <div className="h-6 w-6 text-purple-500">👥</div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.stats?.totalUsers?.toLocaleString() || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-500 bg-opacity-10">
                <div className="h-6 w-6 text-yellow-500">📦</div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.stats?.totalProducts?.toLocaleString() || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <p className="text-green-800">✅ Bypass test completed!</p>
        <p className="text-green-600 mt-2">
          {stats ? 'API call successful - authentication is the issue' : 'API call failed - check console for details'}
        </p>
      </div>
      
      <div className="mt-4 space-x-4">
        <a href="/admin/login" className="text-blue-600 hover:text-blue-800 underline">
          Go to Admin Login
        </a>
        <a href="/admin" className="text-blue-600 hover:text-blue-800 underline">
          Go to Admin Dashboard (with auth)
        </a>
      </div>
    </div>
  );
}
