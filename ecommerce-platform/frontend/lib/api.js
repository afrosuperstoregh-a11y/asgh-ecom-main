// API configuration for different environments
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Production environment for afrosuperstore.ca
    if (window.location.hostname.includes('afrosuperstore.ca')) {
      return '/api'; // Use API proxy in production
    }
    
    // Development environment
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3001/api'; // Local backend
    }
    
    // Fallback URLs for other environments
    if (window.location.hostname.includes('vercel.app')) {
      return '/api'; // Use local API proxy for Vercel
    } else {
      return '/api'; // Relative path for same deployment
    }
  } else {
    // Server-side
    return process.env.NEXT_PUBLIC_API_URL || 
           (process.env.NODE_ENV === 'development' ? 'http://localhost:3001/api' : '/api');
  }
};

export const API_BASE_URL = getApiUrl();

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
    console.error('API Request Error:', error);
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
