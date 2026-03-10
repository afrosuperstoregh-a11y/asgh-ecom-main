import { API_BASE_URL, apiRequest } from './api';

// Authentication utilities
export const auth = {
  // Store authentication data
  setAuthData: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  // Get authentication data
  getAuthData: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');
      return {
        token,
        user: user ? JSON.parse(user) : null
      };
    }
    return { token: null, user: null };
  },

  // Clear authentication data
  clearAuthData: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const { token } = auth.getAuthData();
    return !!token;
  },

  // Get current user
  getCurrentUser: () => {
    const { user } = auth.getAuthData();
    return user;
  },

  // Login
  login: async (credentials) => {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.success && response.token) {
        auth.setAuthData(response.token, response.user);
        return response;
      }
      
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register
  register: async (userData) => {
    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.success && response.token) {
        auth.setAuthData(response.token, response.user);
        return response;
      }
      
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      auth.clearAuthData();
    }
  },

  // Get current user from server
  getMe: async () => {
    try {
      const response = await apiRequest('/auth/me');
      if (response.success) {
        return response.user;
      }
      return null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },

  // Validate token
  validateToken: async () => {
    try {
      const response = await apiRequest('/auth/validate');
      return response.success;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      
      if (response.success) {
        return response;
      }
      
      throw new Error(response.message || 'Password reset request failed');
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    try {
      const response = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      
      if (response.success) {
        return response;
      }
      
      throw new Error(response.message || 'Password reset failed');
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  // Check if user has specific role
  hasRole: (role) => {
    const user = auth.getCurrentUser();
    return user && user.role === role;
  },

  // Check if user is admin
  isAdmin: () => {
    return auth.hasRole('admin');
  },

  // Check if user is manager
  isManager: () => {
    return auth.hasRole('manager') || auth.hasRole('admin');
  }
};

export default auth;
