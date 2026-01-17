const API_BASE = '/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Authentication endpoints
  async register(userData) {
    return this.request('/auth-simple/register', {
      method: 'POST',
      body: userData,
    });
  }

  async login(credentials) {
    return this.request('/auth-simple/login', {
      method: 'POST',
      body: credentials,
    });
  }

  async getProfile(token) {
    return this.request('/auth-simple/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Product endpoints
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  // Category endpoints
  async getCategories() {
    return this.request('/categories');
  }

  async getCategory(id) {
    return this.request(`/categories/${id}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

const apiService = new ApiService();
export default apiService;
