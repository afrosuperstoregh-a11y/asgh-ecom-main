const AuthService = require('../services/authService');

const authService = new AuthService();

// Authentication middleware for API routes
const authenticate = async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies?.['auth-token'] || 
                 req.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate token
    const result = await authService.validateSession(token);

    if (!result.valid) {
      // Clear invalid cookies
      res.clearCookie('auth-token');
      res.clearCookie('refresh-token');

      return res.status(401).json({
        success: false,
        message: result.error || 'Invalid authentication'
      });
    }

    // Add user info to request
    req.user = result.user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Super admin only middleware
const requireSuperAdmin = authorize('SUPER_ADMIN');

// Admin or higher middleware
const requireAdmin = authorize('ADMIN', 'SUPER_ADMIN');

// Audit logging middleware factory
const auditAdminAction = (action) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the action after response is sent
      setImmediate(async () => {
        try {
          await authService.logAuthEvent({
            userId: req.user?.id || null,
            email: req.user?.email || null,
            action,
            ipAddress: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
            userAgent: req.get('User-Agent'),
            success: data.success !== false,
            error: data.success === false ? (data.message || 'Unknown error') : null,
            metadata: {
              method: req.method,
              url: req.originalUrl,
              body: req.method !== 'GET' ? req.body : undefined,
              params: req.params,
              query: req.query
            }
          });
        } catch (error) {
          console.error('Audit logging error:', error);
          // Don't fail the request if logging fails
        }
      });

      return originalJson.call(this, data);
    };

    next();
  };
};

// CSRF validation middleware
const validateCSRF = (req, res, next) => {
  // Only validate for state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'];
  const cookieToken = req.cookies?.['csrf-token'];

  if (!token || !cookieToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token required'
    });
  }

  // Constant-time comparison to prevent timing attacks
  if (token.length !== cookieToken.length) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }

  if (result !== 0) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }

  next();
};

// Rate limiting middleware factory
const createRateLimit = (windowMs, max, message) => {
  const rateLimit = require('express-rate-limit');
  
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      // Log rate limit exceeded
      authService.logAuthEvent({
        userId: req.user?.id || null,
        email: req.user?.email || null,
        action: 'RATE_LIMIT_EXCEEDED',
        ipAddress: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.get('User-Agent'),
        success: false,
        error: `Rate limit exceeded: ${req.originalUrl}`
      });

      res.status(429).json({
        success: false,
        message: message || 'Too many requests. Please try again later.'
      });
    }
  });
};

// Pre-configured rate limiters
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts. Please try again later.'
);

const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests. Please try again later.'
);

const sensitiveActionRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 sensitive actions
  'Too many sensitive actions. Please try again later.'
);

module.exports = {
  authenticate,
  authorize,
  requireSuperAdmin,
  requireAdmin,
  auditAdminAction,
  validateCSRF,
  createRateLimit,
  authRateLimit,
  generalRateLimit,
  sensitiveActionRateLimit
};
