const express = require('express');
const router = express.Router();

// Admin authentication routes
router.post('/auth/login', async (req, res) => {
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
        token: 'mock-jwt-token-for-super-admin'
      });
    }

    // For demo purposes, accept any admin credentials
    // In production, this should validate against database
    if (email.includes('@afrosuperstore.ca')) {
      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: 'admin-demo',
          email: email,
          name: 'Admin User',
          role: 'admin',
          emailVerified: true
        },
        token: 'mock-jwt-token-for-admin'
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

router.post('/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

router.get('/auth/me', (req, res) => {
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

module.exports = router;
