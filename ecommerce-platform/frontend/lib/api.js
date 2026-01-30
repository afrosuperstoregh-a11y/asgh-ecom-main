// API configuration for different environments
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Production environment for afrosuperstore.ca
    if (window.location.hostname.includes('afrosuperstore.ca')) {
      return 'https://api.afrosuperstore.ca'; // Production API endpoint
    }
    
    // Development environment
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3001/api'; // Backend on port 3001
    }
    
    // Fallback URLs for other environments
    if (window.location.hostname.includes('vercel.app')) {
      return 'https://asca-backend.onrender.com/api'; // Production backend
    } else {
      return '/api'; // Relative path for same deployment
    }
  } else {
    // Server-side
    return process.env.NEXT_PUBLIC_API_URL || 
           (process.env.NODE_ENV === 'development' ? 'http://localhost:3001/api' : 'https://api.afrosuperstore.ca');
  }
};

export const API_BASE_URL = getApiUrl();

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

  // Add authorization header if token is available
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
      throw new Error(errorData.error?.message || errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('API Request Error:', error);
    throw error;
  }
}

// Specific API methods
export const api = {
  // Products
  getProducts: () => apiRequest('/products'),
  getProduct: (id) => apiRequest(`/products/${id}`),
  
  // Categories
  getCategories: () => apiRequest('/categories'),
  
  // Testimonials
  getTestimonials: () => apiRequest('/testimonials'),
  
  // Auth
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  getMe: () => apiRequest('/auth/me'),
  
  logout: () => apiRequest('/auth/logout', {
    method: 'POST',
  }),
};
