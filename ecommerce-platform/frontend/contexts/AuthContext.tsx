'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token and set user
      validateToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      // API call to validate token - using backend API endpoint
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Frontend login attempt:', { email, apiBaseUrl: API_BASE_URL });
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      console.log('Frontend login response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Frontend login response data:', responseData);
        
        // Handle both response formats - direct user data or nested data
        const userData = responseData.data?.user || responseData.user || responseData;
        const token = responseData.data?.token || responseData.token;
        
        console.log('Frontend parsed user data:', userData);
        console.log('Frontend parsed token:', token ? 'exists' : 'missing');
        
        if (userData && token) {
          setUser(userData);
          localStorage.setItem('token', token);
          console.log('Frontend login successful');
          return true;
        } else {
          console.log('Frontend login failed: missing user data or token');
        }
      } else {
        // Handle login errors
        const errorData = await response.json().catch(() => ({}));
        console.error('Frontend login error:', errorData.message || 'Invalid credentials');
      }
      return false;
    } catch (error) {
      console.error('Frontend login failed:', error);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // Handle both response formats - direct user data or nested data
        const newUser = responseData.data?.user || responseData.user || responseData;
        const token = responseData.data?.token || responseData.token;
        
        if (newUser && token) {
          setUser(newUser);
          localStorage.setItem('token', token);
          return true;
        }
      } else {
        // Handle registration errors
        const errorData = await response.json().catch(() => ({}));
        console.error('Registration error:', errorData.message || 'Registration failed');
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Redirect to Google OAuth endpoint
      window.location.href = `${API_BASE_URL}/auth/google`;
    } catch (error) {
      console.error('Google sign-in failed:', error);
    }
  };

  const signInWithFacebook = async () => {
    try {
      // Redirect to Facebook OAuth endpoint
      window.location.href = `${API_BASE_URL}/auth/facebook`;
    } catch (error) {
      console.error('Facebook sign-in failed:', error);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local state regardless of API call success
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    signInWithGoogle,
    signInWithFacebook,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
