const express = require('express');
const { authenticateUser } = require('../config/supabase');
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

    console.log('Login attempt:', { email, passwordLength: password?.length });

    // Authenticate user with Supabase
    const user = await authenticateUser(email, password);
    
    if (!user) {
      console.log('Authentication failed for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('Login successful for user:', email);

    // Return success response
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
