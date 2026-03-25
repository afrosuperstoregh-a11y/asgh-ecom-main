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
  
  // Check if token is expired and refresh if needed
  checkAndRefreshToken: function(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Check if token is expired
    if (!this.validateToken(token)) {
      console.log('Token expired, clearing and redirecting to login');
      this.removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
      return false;
    }
    
    return true;
  },
  
  // Generate fresh admin token
  generateFreshToken: function(): string {
    const timestamp = Date.now();
    return `prod-jwt-token-admin-${timestamp}`;
  },
  
  validateToken: (token: string | null): boolean => {
    if (!token) return false;
    
    // Handle custom admin token format
    if (token.startsWith('prod-jwt-token-')) {
      const tokenParts = token.split('-');
      
      // Handle both formats: prod-jwt-token-{timestamp} and prod-jwt-token-admin-{timestamp}
      let timestamp: string | undefined;
      
      if (tokenParts[3] && !isNaN(parseInt(tokenParts[3]))) {
        // Format: prod-jwt-token-{timestamp}
        timestamp = tokenParts[3];
      } else if (tokenParts[4] && !isNaN(parseInt(tokenParts[4]))) {
        // Format: prod-jwt-token-admin-{timestamp}
        timestamp = tokenParts[4];
      }
      
      if (timestamp) {
        const tokenTime = parseInt(timestamp);
        const currentTime = Date.now();
        const isExpired = (currentTime - tokenTime) > 30 * 24 * 60 * 1000; // 30 days for development
        
        if (isExpired) {
          console.log('Token expired:', { tokenTime, currentTime, age: currentTime - tokenTime });
          return false;
        }
      }
      
      return true;
    }
    
    // Fallback to standard JWT validation for other tokens
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
