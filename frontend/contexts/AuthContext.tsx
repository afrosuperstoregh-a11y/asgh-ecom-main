'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { logger } from '../lib/logger';
import { API_BASE_URL } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  user_metadata?: {
    role?: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  signUp: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  loading: boolean;
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
    } catch (error: any) {
      logger.auth('Token validation failed', false, error?.message);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      logger.auth('Frontend login attempt', true);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      logger.info('Frontend login response status');
      
      if (response.ok) {
        const responseData = await response.json();
        logger.info('Frontend login response parsed successfully');
        
        // Handle both response formats - direct user data or nested data
        const userData = responseData.data?.user || responseData.user || responseData;
        const token = responseData.data?.token || responseData.token;
        
        logger.info('Frontend parsed user data and token');
        
        if (userData && token) {
          setUser(userData);
          localStorage.setItem('token', token);
          logger.info('Frontend login successful');
          return true;
        } else {
          logger.auth('Frontend login failed - missing data', false);
        }
      } else {
        // Handle login errors
        const errorData = await response.json().catch(() => ({}));
        logger.auth('Frontend login error', false, errorData.message || 'Invalid credentials');
      }
      return false;
    } catch (error: any) {
      logger.auth('Frontend login failed', false, error?.message || 'Unknown error');
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
        logger.auth('Registration error', false, errorData.message || 'Registration failed');
      }
      return false;
    } catch (error: any) {
      logger.auth('Registration failed', false, error?.message || 'Unknown error');
      return false;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Redirect to Google OAuth endpoint
      window.location.href = `${API_BASE_URL}/auth/google`;
    } catch (error: any) {
      logger.auth('Google sign-in failed', false, error?.message);
    }
  };

  const signInWithFacebook = async () => {
    try {
      // Redirect to Facebook OAuth endpoint
      window.location.href = `${API_BASE_URL}/auth/facebook`;
    } catch (error: any) {
      logger.auth('Facebook sign-in failed', false, error?.message);
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
    } catch (error: any) {
      logger.auth('Logout API call failed', false, error?.message);
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
    signUp: register,
    logout,
    resetPassword: async () => true,
    signInWithGoogle,
    signInWithFacebook,
    loading: isLoading,
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
