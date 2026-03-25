import { ErrorHandler, withErrorHandling, ErrorContext, AdminError } from './error-handler';
import { tokenManager } from './token-manager';

// API response wrapper
export interface ApiResponse<T = any> {
  data?: T;
  error?: AdminError;
  success: boolean;
  message?: string;
}

// Products list response type
export interface ProductsListResponse {
  success: boolean;
  data: {
    products: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message?: string;
}

// API client configuration
interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

class AdminApiClient {
  private config: ApiClientConfig;
  private errorHandler: ErrorHandler;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = {
      baseURL: '/api/admin',
      timeout: 10000,
      retries: 3,
      ...config
    };
    this.errorHandler = ErrorHandler.getInstance();
  }

  // Generic request method with error handling
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const context: ErrorContext = {
      action: `${method} ${endpoint}`,
      component: 'AdminApiClient',
      additionalInfo: { method, endpoint, hasData: !!data }
    };

    const apiCall = async () => {
      const url = `${this.config.baseURL}${endpoint}`;
      
      // Get admin token and validate it
      const token = tokenManager.getToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Validate token before making request
      if (!tokenManager.validateToken(token)) {
        // Token is expired, clear it and redirect to login
        tokenManager.removeToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }
        throw new Error('Token expired - please login again');
      }
      
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        credentials: 'include',
        ...options,
      };

      if (data && method !== 'GET') {
        requestOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
      }

      return response.json();
    };

    const result = await withErrorHandling(apiCall, context);
    
    if (result.error) {
      return {
        success: false,
        error: result.error,
        message: this.errorHandler.getUserMessage(result.error)
      };
    }

    return {
      success: true,
      data: result.data
    };
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    return this.request<T>('GET', url);
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data);
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data);
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data);
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }

  // File upload
  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    const context: ErrorContext = {
      action: `UPLOAD ${endpoint}`,
      component: 'AdminApiClient',
      additionalInfo: { fileName: file.name, fileSize: file.size }
    };

    const apiCall = async () => {
      const formData = new FormData();
      formData.append('file', file);
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }

      const response = await fetch(`${this.config.baseURL}${endpoint}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `Upload failed with status ${response.status}`);
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
      }

      return response.json();
    };

    const result = await withErrorHandling(apiCall, context);
    
    if (result.error) {
      return {
        success: false,
        error: result.error,
        message: this.errorHandler.getUserMessage(result.error)
      };
    }

    return {
      success: true,
      data: result.data
    };
  }
}

// Create singleton instance
export const adminApiClient = new AdminApiClient();

// Convenience methods for specific endpoints
export const adminApi = {
  // Products
  products: {
    list: (params?: Record<string, any>) => adminApiClient.get<ProductsListResponse>('/products', params),
    get: (id: string) => adminApiClient.get(`/products/${id}`),
    create: (data: any) => adminApiClient.post('/products', data),
    update: (id: string, data: any) => adminApiClient.put(`/products/${id}`, data),
    delete: (id: string) => adminApiClient.delete(`/products/${id}`),
    export: () => adminApiClient.get('/products/export'),
    import: (file: File) => adminApiClient.upload('/products/import', file),
  },

  // Categories
  categories: {
    list: () => adminApiClient.get('/categories'),
    get: (id: string) => adminApiClient.get(`/categories/${id}`),
    create: (data: any) => adminApiClient.post('/categories', data),
    update: (id: string, data: any) => adminApiClient.put(`/categories/${id}`, data),
    delete: (id: string) => adminApiClient.delete(`/categories/${id}`),
  },

  // Orders
  orders: {
    list: (params?: Record<string, any>) => adminApiClient.get('/orders', params),
    get: (id: string) => adminApiClient.get(`/orders/${id}`),
    updateStatus: (id: string, data: any) => adminApiClient.put(`/orders/${id}/status`, data),
  },

  // Customers
  customers: {
    list: (params?: Record<string, any>) => adminApiClient.get('/customers', params),
    get: (id: string) => adminApiClient.get(`/customers/${id}`),
    update: (id: string, data: any) => adminApiClient.put(`/customers/${id}`, data),
    block: (id: string, data: any) => adminApiClient.patch(`/customers/${id}/block`, data),
    unblock: (id: string, data: any) => adminApiClient.patch(`/customers/${id}/unblock`, data),
  },

  // Payments
  payments: {
    list: (params?: Record<string, any>) => adminApiClient.get('/payments', params),
    get: (id: string) => adminApiClient.get(`/payments/${id}`),
    refund: (id: string, data: any) => adminApiClient.post(`/payments/${id}/refund`, data),
    getStats: () => adminApiClient.get('/payments/stats/overview'),
  },

  // Promotions
  promotions: {
    list: (params?: Record<string, any>) => adminApiClient.get('/promotions', params),
    get: (id: string) => adminApiClient.get(`/promotions/${id}`),
    create: (data: any) => adminApiClient.post('/promotions', data),
    update: (id: string, data: any) => adminApiClient.put(`/promotions/${id}`, data),
    delete: (id: string) => adminApiClient.delete(`/promotions/${id}`),
  },

  // Roles
  roles: {
    list: () => adminApiClient.get('/roles'),
    get: (id: string) => adminApiClient.get(`/roles/${id}`),
    create: (data: any) => adminApiClient.post('/roles', data),
    update: (id: string, data: any) => adminApiClient.put(`/roles/${id}`, data),
    delete: (id: string) => adminApiClient.delete(`/roles/${id}`),
    users: {
      list: () => adminApiClient.get('/roles/users'),
      delete: (id: string) => adminApiClient.delete(`/roles/users/${id}`),
    }
  },

  // Dashboard
  dashboard: {
    getStats: () => adminApiClient.get('/dashboard'),
    getMetrics: () => adminApiClient.get('/dashboard'),
  },

  // Settings
  settings: {
    list: () => adminApiClient.get('/settings'),
    get: (key: string) => adminApiClient.get(`/settings/${key}`),
    update: (key: string, data: any) => adminApiClient.put(`/settings/${key}`, data),
  },

  // Auth
  auth: {
    me: () => adminApiClient.get('/auth/me'),
    login: (data: any) => adminApiClient.post('/auth/login', data),
    logout: () => adminApiClient.post('/auth/logout'),
  },
};

export default adminApiClient;
