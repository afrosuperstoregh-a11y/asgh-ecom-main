# Frontend Integration Guide

## 🚀 Quick Start

The authentication API is running and ready! Here's how to integrate it with your React frontend.

## 📡 API Endpoints

### Authentication (Working ✅)
- **POST** `/api/auth-simple/register` - Register new user
- **POST** `/api/auth-simple/login` - Login user
- **GET** `/api/auth-simple/me` - Get current user profile

### Example API Calls

```javascript
// Register a new user
const register = async (email, password, name) => {
  const response = await fetch('http://localhost:3001/api/auth-simple/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  });
  return response.json();
};

// Login user
const login = async (email, password) => {
  const response = await fetch('http://localhost:3001/api/auth-simple/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

// Get user profile (protected)
const getProfile = async (token) => {
  const response = await fetch('http://localhost:3001/api/auth-simple/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
};
```

## 🔧 Frontend Setup

### 1. Create API Service
Create `client/src/services/api.js`:

```javascript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
  async register(userData) {
    const response = await fetch(`${API_BASE}/auth-simple/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  }

  async login(credentials) {
    const response = await fetch(`${API_BASE}/auth-simple/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return response.json();
  }

  async getProfile(token) {
    const response = await fetch(`${API_BASE}/auth-simple/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  }
}

export default new ApiService();
```

### 2. Create Auth Context
Create `client/src/contexts/AuthContext.js`:

```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    if (savedToken) {
      setToken(savedToken);
      // Verify token and get user
      apiService.getProfile(savedToken)
        .then(data => {
          if (data.success) {
            setUser(data.data.user);
          }
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const register = async (userData) => {
    try {
      const data = await apiService.register(userData);
      if (data.success) {
        setToken(data.data.tokens.accessToken);
        setUser(data.data.user);
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const data = await apiService.login(credentials);
      if (data.success) {
        setToken(data.data.tokens.accessToken);
        setUser(data.data.user);
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 3. Update Login Page
Modify `client/app/auth/login/page.jsx` to use the API:

```javascript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await login(formData);
      setSuccess('Login successful! Redirecting...');
      
      setTimeout(() => {
        router.push('/account');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Rest of your existing JSX remains the same...
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Your existing login form JSX */}
    </div>
  );
}
```

## 🏃‍♂️ Running the Application

### Option 1: Use API Only (Recommended for now)
The API is fully functional. You can:
1. Test with the provided test scripts
2. Build your frontend separately
3. Connect to the API at `http://localhost:3001`

### Option 2: Fix Frontend Build Issues
To fix the TypeScript errors in vendor pages:
1. Remove or comment out vendor-related pages temporarily
2. Focus on authentication pages first
3. Gradually add other features

### Option 3: Use Development Mode
Run the frontend in development mode (no TypeScript strict checking):
```bash
cd client
npm run dev
```

## 🎯 Next Steps

1. ✅ **Test the API** - Already working!
2. 🔄 **Integrate Frontend** - Use the code examples above
3. 📦 **Add Features** - Password reset, email verification, etc.
4. 🗄️ **Database Migration** - Fix Prisma integration for production

## 📞 API Status

- ✅ **Server**: Running on http://localhost:3001
- ✅ **Database**: PostgreSQL with tables created
- ✅ **Redis**: Running for sessions
- ✅ **Authentication**: Fully functional
- ✅ **Health Check**: http://localhost:3001/health

Your authentication system is ready to go! 🚀
