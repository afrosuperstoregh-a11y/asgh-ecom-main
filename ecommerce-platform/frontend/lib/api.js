// API configuration for different environments
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side
    return process.env.NEXT_PUBLIC_API_URL || 
           (process.env.NODE_ENV === 'development' ? 'http://localhost:3000/api' : '/api');
  } else {
    // Server-side
    return process.env.NEXT_PUBLIC_API_URL || '/api';
  }
};

export const API_BASE_URL = getApiUrl();

// Helper function for API calls
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add authorization header if token is available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
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
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
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
