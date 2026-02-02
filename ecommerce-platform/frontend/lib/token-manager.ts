// Centralized token management
export const tokenManager = {
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminToken');
    }
    return null;
  },
  
  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminToken', token);
    }
  },
  
  removeToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
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
    
    // Production tokens should start with 'prod-jwt-token-'
    if (!token.startsWith('prod-jwt-token-')) {
      return false;
    }

    const tokenParts = token.split('-');
    const timestamp = tokenParts[3];
    
    if (timestamp) {
      const tokenTime = parseInt(timestamp);
      const currentTime = Date.now();
      const isExpired = (currentTime - tokenTime) > 24 * 60 * 60 * 1000; // 24 hours
      
      return !isExpired;
    }
    
    return false;
  }
};
