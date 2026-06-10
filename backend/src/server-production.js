const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const path = require('path')

// Import production configurations
const { testSupabaseConnection } = require('../lib/supabase/server')
const getCacheService = require('../lib/cache/redis')
const { globalErrorHandler, notFoundHandler } = require('../middleware/errorHandler')

// Cache service is optional
const cacheService = getCacheService()

// Import API routes
const productsRouter = require('../api/products')
const categoriesRouter = require('../api/categories')

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
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
}))

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: true
}))

// General middleware
app.use(compression())
app.use(morgan('combined'))
app.use(express.json({ 
  limit: '10mb',
  strict: false
}))
app.use(express.urlencoded({ 
  extended: true
}))

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const supabaseStatus = await testSupabaseConnection()
  const redisStatus = cacheService ? await cacheService.testConnection() : false

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Afro Superstore Production API',
    version: '2.0.0',
    services: {
      supabase: supabaseStatus ? 'connected' : 'disconnected',
      redis: redisStatus ? 'connected' : 'disabled'
    }
  })
})

// API Routes
app.use('/api/products', productsRouter)
app.use('/api/categories', categoriesRouter)

// Handle OPTIONS requests for CORS preflight
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.status(200).send()
})

// Serve static files from public directory
app.use(express.static('public'))

// 404 handler
app.use('*', notFoundHandler)

// Global error handler
app.use(globalErrorHandler)

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Afro Superstore Production API running on port ${PORT}`)
  console.log(`📊 Health check available at /api/health`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)

  // Test Supabase connection (critical)
  const supabaseConnected = await testSupabaseConnection()
  if (supabaseConnected) {
    console.log('✓ Supabase connected')
  } else {
    console.error('❌ Supabase connection failed')
  }

  // Test Redis connection (optional)
  if (cacheService) {
    const redisConnected = await cacheService.testConnection()
    if (redisConnected) {
      console.log('✓ Redis connected')
    } else {
      console.log('⚠ Redis disabled - caching unavailable')
    }
  } else {
    console.log('⚠ Redis disabled - caching unavailable')
  }

  console.log('✓ Server startup complete')
})

module.exports = app
