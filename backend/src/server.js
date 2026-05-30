const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

// Production deployment fix - v2 - Use absolute paths based on the current file location
const configPath = path.join(__dirname, 'config', 'env');
const config = require(configPath);

const rateLimiterPath = path.join(__dirname, 'middleware', 'rateLimiter');
const { generalLimiter } = require(rateLimiterPath);

// Import standardized API response middleware
const { errorHandler, requestLogger } = require(path.join(__dirname, 'middleware', 'apiResponse'));

// Only import Redis rate limiter if Redis is enabled
let rateLimiters = {};
if (process.env.REDIS_ENABLED === 'true') {
  const redisRateLimiterPath = path.join(__dirname, 'middleware', 'redisRateLimiter');
  rateLimiters = require(redisRateLimiterPath).rateLimiters;
}

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

// Enhanced security middleware with production-grade configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://checkout.stripe.com",
        "https://js.stripe.com",
        "https://api.paystack.co"
      ],
      styleSrc: [
        "'self'",
        "https://fonts.googleapis.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "https://res.cloudinary.com",
        "https://*.stripe.com",
        "https://www.google-analytics.com"
      ],
      fontSrc: [
        "'self'",
        "data:",
        "https://fonts.gstatic.com"
      ],
      connectSrc: [
        "'self'",
        "https://api.supabase.co",
        "https://api.stripe.com",
        "https://api.paystack.co",
        "https://www.google-analytics.com",
        "https://stats.g.doubleclick.net"
      ],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'self'"],
      frameSrc: [
        "'self'",
        "https://js.stripe.com",
        "https://checkout.stripe.com",
        "https://www.google.com"
      ],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : []
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for compatibility with third-party scripts
  crossOriginResourcePolicy: { 
    policy: "cross-origin" 
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { 
    policy: "strict-origin-when-cross-origin" 
  },
  permittedCrossDomainPolicies: false,
  ieNoOpen: true,
  originAgentCluster: true
}));

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in the allowed list
    if (config.cors.origins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Extension-ID'],
  preflightContinue: true
}));

// Rate limiting
app.use(generalLimiter);

// Cookie parser middleware for secure cookie handling
app.use(cookieParser(process.env.SESSION_SECRET));

// Session middleware
app.use(sessionMiddleware);

// Redis-based rate limiting for sensitive endpoints (only if Redis is enabled)
if (process.env.REDIS_ENABLED === 'true') {
  app.use('/api/auth/login', rateLimiters.login);
  app.use('/api/auth/register', rateLimiters.register);
  app.use('/api/orders', rateLimiters.orders);
  app.use('/api/payments', rateLimiters.payments);
}

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
      res.setHeader('Content-Security-Policy', "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://checkout.stripe.com https://js.stripe.com https://api.paystack.co; style-src 'self' https://fonts.googleapis.com; img-src 'self' data: https: https://res.cloudinary.com https://*.stripe.com https://www.google-analytics.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.supabase.co https://api.stripe.com https://api.paystack.co https://www.google-analytics.com https://stats.g.doubleclick.net; frame-ancestors 'none'; base-uri 'self';");
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
    
    return originalSend.call(this, data);
  };
  
  next();
});

// Request logging middleware
app.use(requestLogger);

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
app.use('/api/products', require(path.join(__dirname, 'routes', 'products'))); // Updated with bulk activate endpoint
app.use('/api/orders', require(path.join(__dirname, 'routes', 'orders')));
// app.use('/api/payments', require(path.join(__dirname, 'routes', 'payments')));
app.use('/api/paystack', require(path.join(__dirname, 'routes', 'paystack')));
app.use('/api/users', require(path.join(__dirname, 'routes', 'users')));
app.use('/api/categories', require(path.join(__dirname, 'routes', 'categories')));
app.use('/api/settings', require(path.join(__dirname, 'routes', 'settings')));
app.use('/api/crm', require(path.join(__dirname, 'routes', 'crm')));
app.use('/api/cache', require(path.join(__dirname, 'routes', 'cache')));

// 404 handler
app.use('*', (req, res) => {
  const { ApiResponse } = require(path.join(__dirname, 'middleware', 'apiResponse'));
  return ApiResponse.notFound(res, `Cannot ${req.method} ${req.originalUrl}`);
});

// Global error handler using standardized middleware
app.use(errorHandler);

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
