// Shared authentication utilities

export const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Production environment for afrosuperstore.ca
    if (hostname.includes('afrosuperstore.ca')) {
      return '/api'; // Use API proxy in production
    }
    
    // Development environment
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3002'; // Admin backend on port 3002
    }
    
    // Fallback for other environments
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${hostname}:3002`;
    return baseUrl.replace(/\/api$/, '');
  }
  
  // Server-side fallback
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  return baseUrl.replace(/\/api$/, '');
};

export const storage = {
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
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    // Handle production mock tokens
    if (token.startsWith('prod-jwt-token-')) {
      // Extract timestamp from production token
      const timestamp = token.split('-')[3];
      if (timestamp) {
        const tokenTime = parseInt(timestamp);
        const currentTime = Date.now();
        // Check if token is older than 24 hours
        return (currentTime - tokenTime) > 24 * 60 * 60 * 1000;
      }
      return false; // If we can't parse timestamp, assume it's valid
    }
    
    // Handle development JWT tokens
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true; // Invalid token
  }
};

export const validateToken = (token: string | null): boolean => {
  if (!token) return false;
  
  // Production tokens should start with 'prod-jwt-token-'
  // Development tokens should be valid JWTs
  return token.startsWith('prod-jwt-token-') || !isTokenExpired(token);
};
