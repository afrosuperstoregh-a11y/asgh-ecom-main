require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  
  // Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // JWT Configuration - NO DEFAULTS FOR SECURITY
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // Stripe Configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  
  // Email Configuration
  email: {
    provider: process.env.EMAIL_PROVIDER || 'sendgrid',
    apiKey: process.env.EMAIL_API_KEY,
    fromEmail: process.env.FROM_EMAIL || 'noreply@afrosuperstore.ca',
    fromName: process.env.FROM_NAME || 'Afro Superstore',
  },
  
  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'asca_ecom:',
  },
  
  // Session Configuration - NO DEFAULTS FOR SECURITY
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
    ttl: parseInt(process.env.SESSION_TTL) || 86400, // 24 hours in seconds
    domain: process.env.SESSION_DOMAIN,
  },
  
  // Cache Configuration
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL) || 300, // 5 minutes
    productListTTL: parseInt(process.env.CACHE_PRODUCT_LIST_TTL) || 300,
    productDetailsTTL: parseInt(process.env.CACHE_PRODUCT_DETAILS_TTL) || 600,
    categoriesTTL: parseInt(process.env.CACHE_CATEGORIES_TTL) || 1800,
  },
  
  // CORS Configuration - Environment-based
  cors: {
    origins: process.env.NODE_ENV === 'production'
      ? [
          process.env.FRONTEND_URL || 'https://www.afrosuperstore.ca',
          'https://afrosuperstore.ca',
        ]
      : [
          process.env.FRONTEND_URL || 'https://www.afrosuperstore.ca',
          'https://afrosuperstore.ca',
          'http://localhost:3000',
          'http://localhost:3001',
        ],
    credentials: true,
  },
  
  // File Upload Configuration
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  
  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  },
};

// Strict validation with minimum length requirements
const requiredEnvVars = [
  { name: 'JWT_SECRET', minLength: 32 },
  { name: 'SESSION_SECRET', minLength: 32 },
  { name: 'SUPABASE_URL', minLength: 10 },
  { name: 'SUPABASE_ANON_KEY', minLength: 20 },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', minLength: 20 },
  { name: 'NODE_ENV', minLength: 3 },
];

const missingEnvVars = [];
const invalidEnvVars = [];

requiredEnvVars.forEach(({ name, minLength }) => {
  const value = process.env[name];
  if (!value) {
    missingEnvVars.push(name);
  } else if (minLength && value.length < minLength) {
    invalidEnvVars.push(`${name} (must be at least ${minLength} characters)`);
  }
});

if (missingEnvVars.length > 0 || invalidEnvVars.length > 0) {
  console.error('❌ Environment Configuration Error:');
  
  if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
  }
  
  if (invalidEnvVars.length > 0) {
    console.error('Invalid environment variables:', invalidEnvVars.join(', '));
  }
  
  console.error('\nPlease set these environment variables before starting the server.');
  console.error('See backend/.env.example for required variables.');
  
  // Always fail on missing/invalid env vars - no fallbacks for security
  process.exit(1);
}

module.exports = config;
