const express = require('express');
const bcrypt = require('bcryptjs');
const { findUserByEmail } = require('../config/database');
const { findUserByEmail: findSupabaseUserByEmail } = require('../config/supabase');
const { authenticateToken, requireAdmin, generateToken } = require('../middleware/auth');
const { adminAuthLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// Admin authentication routes
router.post('/auth/login', adminAuthLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // TEMPORARY: Hardcoded admin credentials for testing
    if (email === 'admin@afrosuperstore.ca' && password === 'Admin123!') {
      const testUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@afrosuperstore.ca',
        first_name: 'Super',
        last_name: 'Admin',
        role: 'super_admin',
        email_verified: true
      };

      // Generate JWT token
      const token = generateToken(testUser);

      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: testUser.id,
          email: testUser.email,
          name: `${testUser.first_name} ${testUser.last_name}`,
          role: testUser.role,
          emailVerified: testUser.email_verified
        },
        token,
        redirectTo: '/admin'
      });
    }

    // Find user in Supabase first, then fall back to PostgreSQL
    let user = null;
    
    try {
      // Try Supabase first
      user = await findSupabaseUserByEmail(email);
      console.log('✅ User found in Supabase:', user?.email);
    } catch (supabaseError) {
      console.log('⚠️ Supabase lookup failed, trying PostgreSQL:', supabaseError.message);
    }
    
    // If not found in Supabase, try PostgreSQL
    if (!user) {
      try {
        user = await findUserByEmail(email);
        console.log('✅ User found in PostgreSQL:', user?.email);
      } catch (pgError) {
        console.log('❌ PostgreSQL lookup failed:', pgError.message);
      }
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user has admin role
    if (!['admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - admin privileges required'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        emailVerified: user.email_verified
      },
      token,
      redirectTo: '/admin-dashboard.html'
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.post('/auth/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

router.get('/auth/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: `${req.user.first_name} ${req.user.last_name}`,
      role: req.user.role,
      emailVerified: req.user.email_verified
    }
  });
});

// Protected admin routes - all require authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Admin root endpoint - provides admin info and available routes
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Admin panel access confirmed',
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          name: `${req.user.first_name} ${req.user.last_name}`,
          role: req.user.role
        },
        availableRoutes: [
          '/admin/dashboard',
          '/admin/products',
          '/admin/categories',
          '/admin/orders',
          '/admin/users',
          '/admin/payments',
          '/admin/settings',
          '/admin/analytics'
        ],
        permissions: {
          canManageProducts: true,
          canManageOrders: true,
          canManageUsers: req.user.role === 'super_admin',
          canManageSettings: req.user.role === 'super_admin',
          canViewAnalytics: true
        }
      }
    });
  } catch (error) {
    console.error('Admin root error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load admin panel'
    });
  }
});

// Admin dashboard endpoint
router.get('/dashboard', async (req, res) => {
  try {
    // TEMPORARY: Return mock data for testing
    if (req.user.id === '00000000-0000-0000-0000-000000000001') {
      const mockData = {
        user: {
          id: req.user.id,
          email: req.user.email,
          name: `${req.user.first_name} ${req.user.last_name}`,
          role: req.user.role
        },
        stats: {
          totalOrders: 156,
          totalUsers: 89,
          totalProducts: 45,
          totalRevenue: 25430.50
        },
        recentOrders: [
          {
            order_number: 'ORD-2024-001',
            total_amount: 129.99,
            status: 'completed',
            created_at: new Date().toISOString(),
            email: 'customer1@example.com'
          },
          {
            order_number: 'ORD-2024-002', 
            total_amount: 89.50,
            status: 'processing',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            email: 'customer2@example.com'
          }
        ],
        lastLogin: new Date().toISOString()
      };

      return res.json({
        success: true,
        message: 'Admin dashboard loaded successfully (mock data)',
        data: mockData
      });
    }

    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Get dashboard statistics
    const [
      totalOrdersResult,
      totalUsersResult,
      totalProductsResult,
      recentOrdersResult,
      totalRevenueResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM orders'),
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM products WHERE status = \'active\''),
      pool.query(`
        SELECT o.order_number, o.total_amount, o.status, o.created_at, u.email 
        FROM orders o 
        LEFT JOIN users u ON o.customer_id = u.id 
        ORDER BY o.created_at DESC 
        LIMIT 5
      `),
      pool.query('SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE payment_status = \'paid\'')
    ]);

    const dashboardData = {
      user: {
        id: req.user.id,
        email: req.user.email,
        name: `${req.user.first_name} ${req.user.last_name}`,
        role: req.user.role
      },
      stats: {
        totalOrders: parseInt(totalOrdersResult.rows[0].count),
        totalUsers: parseInt(totalUsersResult.rows[0].count),
        totalProducts: parseInt(totalProductsResult.rows[0].count),
        totalRevenue: parseFloat(totalRevenueResult.rows[0].revenue)
      },
      recentOrders: recentOrdersResult.rows,
      lastLogin: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Admin dashboard loaded successfully',
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data'
    });
  }
});

module.exports = router;
