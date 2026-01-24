const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

// Import routes
const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const testimonialsRouter = require('./routes/testimonials');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const authSimpleRouter = require('./routes/auth-simple');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Routes
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/testimonials', testimonialsRouter);
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/auth-simple', authSimpleRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E-commerce API Server',
    version: '2.0.0',
    endpoints: {
      products: '/api/products',
      categories: '/api/categories',
      testimonials: '/api/testimonials',
      auth: '/api/auth',
      user: '/api/user',
      health: '/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong!',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      path: req.originalUrl
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
  console.log(`🏷️  Categories API: http://localhost:${PORT}/api/categories`);
  console.log(`💬 Testimonials API: http://localhost:${PORT}/api/testimonials`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👤 User API: http://localhost:${PORT}/api/user`);
});

module.exports = app;
