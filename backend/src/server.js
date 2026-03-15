const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Production deployment fix - v2 - Use absolute paths based on the current file location
const configPath = path.join(__dirname, 'config', 'env');
const config = require(configPath);

const rateLimiterPath = path.join(__dirname, 'middleware', 'rateLimiter');
const { generalLimiter } = require(rateLimiterPath);

const redisRateLimiterPath = path.join(__dirname, 'middleware', 'redisRateLimiter');
const { rateLimiters } = require(redisRateLimiterPath);

const supabasePath = path.join(__dirname, 'config', 'supabase');
const { testConnection } = require(supabasePath);

const redisPath = path.join(__dirname, 'config', 'redis');
const { testConnection: testRedisConnection } = require(redisPath);

const sessionPath = path.join(__dirname, 'config', 'session');
const { sessionMiddleware } = require(sessionPath);

const loggerPath = path.join(__dirname, 'utils', 'logger');
const logger = require(loggerPath);

const app = express();
const PORT = config.port;

// Trust proxy disabled for security - only enable behind trusted reverse proxy
// app.set('trust proxy', true);

// Security middleware with proper configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https:"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'self'"],
      frameSrc: ["'self'"],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true
}));

app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Extension-ID'],
  preflightContinue: true
}));

// Rate limiting
app.use(generalLimiter);

// Session middleware
app.use(sessionMiddleware);

// Redis-based rate limiting for sensitive endpoints
app.use('/api/auth/login', rateLimiters.login);
app.use('/api/auth/register', rateLimiters.register);
app.use('/api/orders', rateLimiters.orders);
app.use('/api/payments', rateLimiters.payments);

// Browser extension validation middleware - secure approach
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const origin = req.get('Origin') || '';
  const extensionId = req.get('X-Extension-ID');
  
  // List of allowed extension IDs (replace with actual approved extensions)
  const allowedExtensionIds = process.env.ALLOWED_EXTENSION_IDS ? 
    process.env.ALLOWED_EXTENSION_IDS.split(',') : [];
  
  // Check if this is an extension request
  const isExtensionRequest = extensionId || 
    req.url.includes('extension') || 
    req.url.includes('chrome-extension://') ||
    req.url.includes('moz-extension://');
  
  const isKnownOrigin = origin.includes('afrosuperstore.ca') || 
                        origin.includes('localhost') || 
                        !origin; // Allow same-origin requests
  
  // Validate extension requests
  if (isExtensionRequest && !isKnownOrigin) {
    if (extensionId && allowedExtensionIds.length > 0) {
      // Check if extension ID is in allowed list
      if (!allowedExtensionIds.includes(extensionId)) {
        console.log('🚫 Unauthorized extension access attempt:', extensionId);
        return res.status(403).json({
          error: 'Unauthorized extension',
          message: 'Extension not approved for access'
        });
      }
      console.log('✅ Authorized extension access:', extensionId);
    } else {
      // Block unknown extensions
      console.log('🚫 Unknown extension access blocked');
      return res.status(403).json({
        error: 'Unknown extension',
        message: 'Extension validation required'
      });
    }
  }
  
  // Handle undefined/null requests that extensions might send
  if (req.body === undefined || req.body === null) {
    req.body = {};
  }
  
  next();
});

// Prevent browser extension interference with HTML responses
app.use((req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Add anti-interference headers to prevent extensions from modifying HTML
    if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
      res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline' 'unsafe-eval' *; style-src 'self' 'unsafe-inline' *; img-src 'self' data: *; font-src 'self' *; connect-src 'self' *;");
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
    
    return originalSend.call(this, data);
  };
  
  next();
});

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ 
  limit: '10mb',
  strict: false // Allow non-strict JSON parsing to handle extension requests
}));
app.use(express.urlencoded({ 
  extended: true
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Afro Superstore Backend API',
    version: '1.0.0'
  });
});

// Handle browser extension requests that might cause errors
app.all('/api/extension/*', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Extension request handled',
    data: null
  });
});

// Handle OPTIONS requests for CORS preflight
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Extension-ID');
  res.status(200).send();
});

// Handle extension interference with main routes
app.use((req, res, next) => {
  // Check if this is an extension request trying to interfere
  const userAgent = req.get('User-Agent') || '';
  const isExtension = userAgent.includes('Chrome/') && (
    req.url.includes('extension') || 
    req.get('X-Extension-ID') ||
    req.headers['x-extension-id']
  );
  
  if (isExtension && req.method === 'GET' && !req.url.startsWith('/api/')) {
    // Return empty response for extension requests to prevent HTML interference
    return res.status(200).send('');
  }
  
  next();
});

// Serve static files from public directory
app.use(express.static('public'));

// API Routes
// Note: /api/auth routes are now handled by Supabase directly in the frontend
// We'll keep the health check endpoint but disable the old auth routes
// app.use('/api/auth', require(path.join(__dirname, 'routes', 'auth'))); // Disabled - using Supabase Auth
app.use('/api/admin', require(path.join(__dirname, 'routes', 'admin')));
// app.use('/api/analytics', require(path.join(__dirname, 'routes', 'analytics')));
app.use('/api/products', require(path.join(__dirname, 'routes', 'products')));
app.use('/api/orders', require(path.join(__dirname, 'routes', 'orders')));
// app.use('/api/payments', require(path.join(__dirname, 'routes', 'payments')));
app.use('/api/users', require(path.join(__dirname, 'routes', 'users')));
app.use('/api/categories', require(path.join(__dirname, 'routes', 'categories')));
app.use('/api/settings', require(path.join(__dirname, 'routes', 'settings')));
app.use('/api/crm', require(path.join(__dirname, 'routes', 'crm')));
app.use('/api/cache', require(path.join(__dirname, 'routes', 'cache')));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID',
      message: 'The provided ID is not valid'
    });
  }
  
  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      success: false,
      error: 'Duplicate Entry',
      message: 'This record already exists'
    });
  }
  
  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      success: false,
      error: 'Reference Error',
      message: 'Referenced record does not exist'
    });
  }
  
  // Handle undefined/null errors that cause browser extension issues
  if (err.message && err.message.includes('Cannot destructure')) {
    return res.status(400).json({
      success: false,
      error: 'Request Error',
      message: 'Invalid request format'
    });
  }
  
  // Default error response
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: statusCode < 500 ? 'Request Error' : 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Afro Superstore Backend API running on port ${PORT}`);
  console.log(`📊 Health check available at /api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test Supabase connection
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log('🔐 Supabase connection established');
  } else {
    console.log('❌ Supabase connection failed');
  }
  
  // Test Redis connection
  const redisConnected = await testRedisConnection();
  if (redisConnected) {
    console.log('🔥 Redis connection established');
  } else {
    console.log('❌ Redis connection failed - caching disabled');
  }
});

module.exports = app;
