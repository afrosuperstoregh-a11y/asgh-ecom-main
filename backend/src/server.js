const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { generalLimiter } = require('./middleware/rateLimiter');
const { testConnection } = require('./config/supabase');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to prevent extension conflicts
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  hsts: false, // Disable HSTS to prevent extension issues
  noSniff: false // Disable MIME type sniffing prevention
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://www.afrosuperstore.ca',
    'http://localhost:3000',
    'http://localhost:3001',
    'chrome-extension://*', // Allow browser extensions
    'moz-extension://*' // Allow Firefox extensions
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Extension-ID'],
  preflightContinue: true
}));

// Rate limiting
app.use(generalLimiter);

// Browser extension compatibility middleware
app.use((req, res, next) => {
  // Handle browser extension requests that might cause issues
  const userAgent = req.get('User-Agent') || '';
  
  // Check if request is from a browser extension
  if (userAgent.includes('Chrome/') && (req.url.includes('extension') || req.get('X-Extension-ID'))) {
    // Set headers to prevent extension interference
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
  }
  
  // Handle undefined/null requests that extensions might send
  if (req.body === undefined || req.body === null) {
    req.body = {};
  }
  
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

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/settings', require('./routes/settings'));

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
});

module.exports = app;
