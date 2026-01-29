const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Enhanced CORS configuration
const allowedOrigins = [
  'https://www.afrosuperstore.ca',
  'https://afrosuperstore.ca',
  'https://asca-ecom.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Extension-ID'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Afro Superstore Admin API',
    version: '1.0.0'
  });
});

// Admin authentication routes
app.post('/api/admin/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check for super admin credentials
    if (email === 'info@afrosuperstore.ca' && password === 'Iamtech@100') {
      const token = 'mock-jwt-token-for-super-admin-' + Date.now();
      
      // Set secure cookie
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      };
      
      res.cookie('auth-token', token, cookieOptions);
      
      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: 'admin-001',
          email: 'info@afrosuperstore.ca',
          name: 'Super Admin',
          role: 'super_admin',
          emailVerified: true
        },
        token: token
      });
    }

    // Check for second admin credentials
    if (email === 'admin@afrosuperstore.ca' && password === 'Admin123!') {
      const token = 'mock-jwt-token-for-admin-' + Date.now();
      
      // Set secure cookie
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      };
      
      res.cookie('auth-token', token, cookieOptions);
      
      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: 'admin-002',
          email: 'admin@afrosuperstore.ca',
          name: 'Admin User',
          role: 'admin',
          emailVerified: true
        },
        token: token
      });
    }

    // Invalid credentials
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/admin/auth/logout', (req, res) => {
  // Clear authentication cookie
  res.clearCookie('auth-token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    path: '/'
  });
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

app.get('/api/admin/auth/me', (req, res) => {
  res.json({
    success: true,
    user: {
      id: 'admin-001',
      email: 'info@afrosuperstore.ca',
      name: 'Super Admin',
      role: 'super_admin',
      emailVerified: true
    }
  });
});

// Dashboard data route
app.get('/api/admin/dashboard', (req, res) => {
  // Mock dashboard data - replace with actual database queries
  const mockDashboardData = {
    success: true,
    data: {
      stats: {
        totalOrders: 156,
        totalRevenue: 28450.75,
        totalUsers: 89,
        totalProducts: 42
      },
      recentOrders: [
        {
          order_number: 'ORD-2024-001',
          email: 'customer1@example.com',
          total_amount: 125.50,
          status: 'PROCESSING',
          created_at: new Date().toISOString()
        },
        {
          order_number: 'ORD-2024-002',
          email: 'customer2@example.com',
          total_amount: 89.99,
          status: 'SHIPPED',
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          order_number: 'ORD-2024-003',
          email: 'customer3@example.com',
          total_amount: 210.00,
          status: 'PENDING',
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]
    }
  };
  
  res.json(mockDashboardData);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Afro Superstore Admin API running on port ${PORT}`);
  console.log(`📊 Health check available at /api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
