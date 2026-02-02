// API configuration - use local Next.js API routes only
export const API_BASE_URL = '/api';

// Environment-safe logging
const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  error: (message, ...args) => {
    if (isDevelopment) {
      console.error(`[API] ${message}`, ...args);
    }
  }
};

// Helper function for API calls
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add authorization header if token is available (from localStorage)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken');
    if (token) {
      defaultOptions.headers.Authorization = `Bearer ${token}`;
    }
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle 401 unauthorized - redirect to login
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
        return;
      }
      
      throw new Error(errorData.error?.message || errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('API Request Error:', error);
    throw error;
  }
}

// Specific API methods - updated for admin routes
export const api = {
  // Admin Auth
  login: (credentials) => apiRequest('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  getMe: () => apiRequest('/admin/auth/me'),
  
  logout: () => apiRequest('/admin/auth/logout', {
    method: 'POST',
  }),
  
  // Admin Dashboard
  getDashboard: () => apiRequest('/admin/dashboard'),
  
  // Products (if needed)
  getProducts: () => apiRequest('/admin/products'),
  getProduct: (id) => apiRequest(`/admin/products/${id}`),
  
  // Categories (if needed)
  getCategories: () => apiRequest('/admin/categories'),
  
  // Testimonials (if needed)
  getTestimonials: () => apiRequest('/admin/testimonials'),
};
