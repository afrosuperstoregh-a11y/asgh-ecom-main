'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Store, AlertTriangle } from 'lucide-react';
import { tokenManager } from '../../../lib/token-manager';
import { LoginResponse } from '../../../types/admin';
import { logger } from '../../../lib/logger';
import AdminDebug from '../../../components/admin/AdminDebug';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect') || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔍 [DEBUG] Admin login form submitted', { email, passwordLength: password.length });
      logger.auth('Admin login form submitted', true);
      
      // Use the local API route instead of external API
      console.log('🔍 [DEBUG] Making request to /api/admin/auth/login');
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('🔍 [DEBUG] Login response status:', response.status);
      const data = await response.json();
      console.log('🔍 [DEBUG] Login response data:', data);

      logger.log('Admin login response received');

      if (data.success && data.token && data.user) {
        console.log('🔍 [DEBUG] Login successful, storing token and user');
        logger.log('Admin login successful, redirecting to:', redirectTo);
        
        // Store JWT token and user data using standardized storage
        tokenManager.setToken(data.token);
        tokenManager.setUser(data.user);
        
        console.log('🔍 [DEBUG] Token stored, redirecting to:', redirectTo);
        console.log('🔍 [DEBUG] Stored token:', tokenManager.getToken());
        console.log('🔍 [DEBUG] Stored user:', tokenManager.getUser());
        
        // Verify token was stored before redirecting
        const storedToken = tokenManager.getToken();
        if (storedToken) {
          console.log('🔍 [DEBUG] Token verification successful, redirecting...');
          // Use window.location for hard redirect to ensure layout re-evaluates
          window.location.href = redirectTo;
        } else {
          console.error('🔍 [DEBUG] Failed to store token');
          setError('Login succeeded but failed to store session. Please try again.');
        }
      } else {
        console.log('🔍 [DEBUG] Login failed:', data.message);
        setError(data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('🔍 [DEBUG] Login error:', error);
      logger.auth('Admin login', false, error?.message || 'Unknown error');
      setError('An error occurred during login: ' + (error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminDebug />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Store className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your admin dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="info@afrosuperstore.ca"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="••••••••"
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="/admin/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link 
              href="/" 
              className="text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              ← Back to Store
            </Link>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Security Notice</span>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="font-medium mb-2 text-blue-900">🔒 Secure Login</p>
            <ul className="space-y-1 text-blue-800">
              <li>• Use your assigned admin credentials</li>
              <li>• Passwords must be at least 8 characters</li>
              <li>• Login attempts are rate-limited</li>
              <li>• Session is secured with JWT tokens</li>
              <li>• All activities are logged for security</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="text-sm text-gray-500">
            <p>Need access? Contact your system administrator</p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
