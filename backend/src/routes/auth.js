const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Authentication routes
router.post('/login', async (req, res) => {
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
    console.log('Login attempt:', { email, passwordLength: password?.length });
    
    if (email === 'info@afrosuperstore.ca') {
      const hashedPassword = '$2a$10$AMoj6oiD/1/NWLE/LQcfyu70906iBSKwDN8l1om.fbt1WJhRgbEUe';
      console.log('Checking super admin credentials...');
      
      try {
        const isValidPassword = await bcrypt.compare(password, hashedPassword);
        console.log('Password verification result:', isValidPassword);
        
        if (isValidPassword) {
          console.log('Super admin login successful');
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
        } else {
          console.log('Super admin password verification failed');
          return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
          });
        }
      } catch (error) {
        console.error('Error during password verification:', error);
        return res.status(500).json({
          success: false,
          message: 'Authentication error'
        });
      }
    }

    // For demo purposes, accept any credentials that aren't super admin
    // In production, this should validate against database
    if (email === 'info@afrosuperstore.ca') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: 'user-demo',
        email: email,
        name: 'Demo User',
        role: 'customer',
        emailVerified: true
      },
      token: 'mock-jwt-token-for-user'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.post('/register', (req, res) => {
  res.json({ 
    success: true,
    message: 'Registration successful - implement user registration logic' 
  });
});

router.post('/logout', (req, res) => {
  res.json({ 
    success: true,
    message: 'Logout successful' 
  });
});

router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Mock password reset response
    return res.json({
      success: true,
      message: 'Password reset instructions sent to your email',
      email: email
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/me', (req, res) => {
  res.json({ 
    success: true,
    message: 'Get current user - implement user profile retrieval' 
  });
});

module.exports = router;
