const express = require('express');
const { authenticateUser } = require('../config/supabase');
const router = express.Router();

// Authentication routes
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('=== AUTHENTICATION ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password length:', password?.length);
    console.log('Request body:', { email, password: '***' });
    
    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Hardcoded super admin check as primary fallback
    if (email === 'info@afrosuperstore.ca' && password === 'Iamtech@100') {
      console.log('✅ Hardcoded super admin authentication successful');
      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: 'cdc9e3ae-08d0-455c-b322-6e7b4b03e906',
          email: 'info@afrosuperstore.ca',
          name: 'Super Admin',
          role: 'super_admin',
          emailVerified: true
        },
        token: 'mock-jwt-token-super-admin'
      });
    }

    console.log('❌ Hardcoded authentication failed, trying Supabase...');

    // Try Supabase authentication as secondary method
    try {
      const user = await authenticateUser(email, password);
      
      if (user) {
        console.log('✅ Supabase authentication successful for:', email);
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
          token: 'mock-jwt-token-' + user.id
        });
      } else {
        console.log('❌ Supabase authentication failed for:', email);
      }
    } catch (supabaseError) {
      console.log('❌ Supabase authentication error:', supabaseError.message);
    }

    console.log('❌ All authentication methods failed for:', email);
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });

  } catch (error) {
    console.error('❌ Login route error:', error);
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
