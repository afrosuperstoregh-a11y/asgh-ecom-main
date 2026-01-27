const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthService = require('../services/authService');
const { auditAdminAction } = require('../middleware/auditMiddleware');

const router = express.Router();
const authService = new AuthService();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // Log rate limit exceeded
    authService.logAuthEvent({
      email: req.body?.email || 'unknown',
      action: 'LOGIN_RATE_LIMITED',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      error: 'Rate limit exceeded'
    });

    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again later.'
    });
  }
});

// Secure login route
router.post('/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const ipAddress = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const result = await authService.authenticate(email, password, ipAddress);

    if (result.success) {
      // Set HTTP-only cookie with access token
      res.cookie('auth-token', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });

      // Set refresh token in separate cookie
      res.cookie('refresh-token', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      // Return user data (without tokens in body for security)
      res.json({
        success: true,
        message: 'Login successful',
        user: result.user
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Refresh token route
router.post('/auth/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies['refresh-token'];
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const ipAddress = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const result = await authService.refreshToken(refreshToken, ipAddress);

    if (result.success) {
      // Set new access token
      res.cookie('auth-token', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });

      // Set new refresh token
      res.cookie('refresh-token', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully'
      });
    } else {
      // Clear invalid tokens
      res.clearCookie('auth-token');
      res.clearCookie('refresh-token');
      
      res.status(401).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout route
router.post('/auth/logout', auditAdminAction('LOGOUT'), async (req, res) => {
  try {
    // Get user info from request (set by auth middleware)
    const userId = req.user?.id;
    const email = req.user?.email;

    // Clear cookies
    res.clearCookie('auth-token');
    res.clearCookie('refresh-token');

    // Log logout
    if (userId) {
      await authService.logAuthEvent({
        userId,
        email,
        action: 'LOGOUT',
        ipAddress: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.get('User-Agent'),
        success: true
      });
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Validate session route
router.get('/auth/me', async (req, res) => {
  try {
    const token = req.cookies['auth-token'];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const result = await authService.validateSession(token);

    if (result.valid) {
      res.json({
        success: true,
        user: result.user
      });
    } else {
      // Clear invalid token
      res.clearCookie('auth-token');
      res.clearCookie('refresh-token');
      
      res.status(401).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change password route
router.post('/auth/change-password', auditAdminAction('PASSWORD_CHANGE'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const ipAddress = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const result = await authService.changePassword(userId, currentPassword, newPassword, ipAddress);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
