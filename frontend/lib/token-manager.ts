// Centralized token management
export const tokenManager = {
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminToken') || document.cookie
        .split('; ')
        .find(row => row.startsWith('admin-token='))
        ?.split('=')[1] || null;
    }
    return null;
  },
  
  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminToken', token);
      // Also set as cookie for middleware access
      document.cookie = `admin-token=${token}; path=/; max-age=86400; SameSite=Lax`;
    }
  },
  
  removeToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      // Remove cookie
      document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  },
  
  setUser: (user: any): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminUser', JSON.stringify(user));
    }
  },
  
  getUser: (): any | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('adminUser');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },
  
  validateToken: (token: string | null): boolean => {
    if (!token) return false;
    
    // Accept standard JWT tokens (remove the strict prefix requirement)
    try {
      // Basic JWT format check (header.payload.signature)
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is expired (with 24 hour buffer)
      return payload.exp ? payload.exp > currentTime : true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
};
