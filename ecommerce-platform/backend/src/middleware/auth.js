const jwt = require('jsonwebtoken');

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || 'customer'
    },
    process.env.JWT_SECRET || 'fallback-secret-key',
    {
      expiresIn: '7d'
    }
  );
}

// Verify JWT token
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }
  
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}

// Admin role middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
}

// Manager role middleware (admin or manager)
function requireManager(req, res, next) {
  if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Manager access required'
    });
  }
  next();
}

// Customer role middleware
function requireCustomer(req, res, next) {
  if (!req.user || req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Customer access required'
    });
  }
  next();
}

// Optional authentication - doesn't fail if no token
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Token is invalid but we continue without user
      console.log('Invalid token in optional auth:', error.message);
    }
  }
  
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  requireAdmin,
  requireManager,
  requireCustomer,
  optionalAuth
};
