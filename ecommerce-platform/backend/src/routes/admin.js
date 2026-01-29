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

router.post('/auth/logout', (req, res) => {
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
