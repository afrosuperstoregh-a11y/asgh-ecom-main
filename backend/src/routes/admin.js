const express = require('express');
const bcrypt = require('bcryptjs');
const { findUserByEmail } = require('../config/database');
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

    // Find user in database
    const user = await findUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
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
        message: 'Invalid email or password'
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
      token
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

// Example admin dashboard endpoint
router.get('/dashboard', async (req, res) => {
  try {
    // Add dashboard logic here
    res.json({
      success: true,
      message: 'Admin dashboard data',
      data: {
        user: req.user,
        // Add dashboard statistics here
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
