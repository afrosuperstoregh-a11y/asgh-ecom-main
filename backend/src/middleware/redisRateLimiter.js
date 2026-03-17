const { RateLimiterRedis } = require('rate-limiter-flexible');
const { redis, isReady } = require('../config/redis');

class RedisRateLimiter {
  constructor() {
    this.limiters = new Map();
    this.client = redis();
    this.redisEnabled = isReady();
  }

  // Create a rate limiter with specific configuration
  createLimiter(options = {}) {
    const {
      keyPrefix = 'rl',
      points = 5, // Number of requests
      duration = 60, // Per 60 seconds
      blockDuration = 60, // Block for 60 seconds if limit exceeded
      execEvenly = false, // Do not delay requests
    } = options;

    const limiterKey = `${keyPrefix}:${points}:${duration}`;

    if (!this.limiters.has(limiterKey)) {
      // Only create Redis rate limiter if Redis is enabled
      if (this.redisEnabled && this.client) {
        const limiter = new RateLimiterRedis({
          storeClient: this.client,
          keyPrefix: `asca_ecom:${keyPrefix}`,
          points,
          duration,
          blockDuration,
          execEvenly,
        });

        this.limiters.set(limiterKey, limiter);
      }
    }

    return this.limiters.get(limiterKey);
  }

  // Middleware factory for rate limiting
  middleware(options = {}) {
    const limiter = this.createLimiter(options);
    const keyGenerator = options.keyGenerator || this.defaultKeyGenerator;

    return async (req, res, next) => {
      // If Redis is disabled, skip rate limiting
      if (!this.redisEnabled) {
        return next();
      }

      try {
        const key = keyGenerator(req);
        const result = await limiter.consume(key);

        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': options.points || 5,
          'X-RateLimit-Remaining': result.remainingPoints,
          'X-RateLimit-Reset': new Date(Date.now() + result.msBeforeNext).toISOString(),
        });

        next();
      } catch (rejRes) {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;

        // Set rate limit exceeded headers
        res.set({
          'X-RateLimit-Limit': options.points || 5,
          'X-RateLimit-Remaining': 0,
          'X-RateLimit-Reset': new Date(Date.now() + rejRes.msBeforeNext).toISOString(),
          'Retry-After': secs.toString(),
        });

        res.status(429).json({
          success: false,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${secs} seconds.`,
          retryAfter: secs,
        });
      }
    };
  }

  // Default key generator (IP-based)
  defaultKeyGenerator(req) {
    return req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  }

  // User-based key generator
  userKeyGenerator(req) {
    if (req.user && req.user.userId) {
      return `user:${req.user.userId}`;
    }
    return this.defaultKeyGenerator(req);
  }

  // IP + User-based key generator (more restrictive)
  ipUserKeyGenerator(req) {
    const ip = this.defaultKeyGenerator(req);
    const user = req.user && req.user.userId ? `user:${req.user.userId}` : 'anonymous';
    return `${ip}:${user}`;
  }

  // Endpoint-specific key generator
  endpointKeyGenerator(req) {
    const ip = this.defaultKeyGenerator(req);
    const endpoint = `${req.method}:${req.route?.path || req.path}`;
    return `${ip}:${endpoint}`;
  }

  // Check remaining points for a key
  async getRemainingPoints(key, options = {}) {
    try {
      const limiter = this.createLimiter(options);
      const result = await limiter.get(key);
      return result ? result.remainingPoints : options.points || 5;
    } catch (error) {
      console.error('Error getting remaining points:', error);
      return 0;
    }
  }

  // Block a key manually
  async blockKey(key, duration = 3600, reason = 'Manual block') {
    try {
      const blockKey = `block:${key}`;
      const client = redis();
      
      await client.setex(blockKey, duration, JSON.stringify({
        reason,
        blockedAt: new Date().toISOString(),
        duration,
      }));
      
      console.log(`🚫 Blocked key: ${key} for ${duration} seconds. Reason: ${reason}`);
      return true;
    } catch (error) {
      console.error('Error blocking key:', error);
      return false;
    }
  }

  // Check if key is blocked
  async isKeyBlocked(key) {
    try {
      const blockKey = `block:${key}`;
      const client = redis();
      
      const blockData = await client.get(blockKey);
      return blockData ? JSON.parse(blockData) : null;
    } catch (error) {
      console.error('Error checking block status:', error);
      return null;
    }
  }

  // Unblock a key
  async unblockKey(key) {
    try {
      const blockKey = `block:${key}`;
      const client = redis();
      
      const result = await client.del(blockKey);
      if (result > 0) {
        console.log(`✅ Unblocked key: ${key}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unblocking key:', error);
      return false;
    }
  }

  // Get rate limit statistics
  async getStats(keyPrefix = 'rl') {
    try {
      const client = redis();
      const pattern = `asca_ecom:${keyPrefix}:*`;
      const keys = await client.keys(pattern);
      
      const stats = {
        totalKeys: keys.length,
        activeKeys: 0,
        blockedKeys: 0,
      };

      for (const key of keys) {
        const ttl = await client.ttl(key);
        if (ttl > 0) {
          stats.activeKeys++;
        }
      }

      // Check blocked keys
      const blockPattern = `asca_ecom:block:*`;
      const blockKeys = await client.keys(blockPattern);
      stats.blockedKeys = blockKeys.length;

      return stats;
    } catch (error) {
      console.error('Error getting rate limit stats:', error);
      return null;
    }
  }
}

// Create singleton instance
const redisRateLimiter = new RedisRateLimiter();

// Predefined rate limiters
const rateLimiters = {
  // General API rate limiter - 100 requests per minute
  general: redisRateLimiter.middleware({
    keyPrefix: 'general',
    points: 100,
    duration: 60,
    keyGenerator: redisRateLimiter.defaultKeyGenerator,
  }),

  // Auth rate limiter - 5 requests per minute
  auth: redisRateLimiter.middleware({
    keyPrefix: 'auth',
    points: 5,
    duration: 60,
    keyGenerator: redisRateLimiter.ipUserKeyGenerator,
  }),

  // Login rate limiter - 3 requests per minute
  login: redisRateLimiter.middleware({
    keyPrefix: 'login',
    points: 3,
    duration: 60,
    keyGenerator: redisRateLimiter.ipUserKeyGenerator,
  }),

  // Registration rate limiter - 2 requests per minute
  register: redisRateLimiter.middleware({
    keyPrefix: 'register',
    points: 2,
    duration: 60,
    keyGenerator: redisRateLimiter.ipUserKeyGenerator,
  }),

  // Order creation rate limiter - 10 requests per minute
  orders: redisRateLimiter.middleware({
    keyPrefix: 'orders',
    points: 10,
    duration: 60,
    keyGenerator: redisRateLimiter.userKeyGenerator,
  }),

  // Payment processing rate limiter - 5 requests per minute
  payments: redisRateLimiter.middleware({
    keyPrefix: 'payments',
    points: 5,
    duration: 60,
    keyGenerator: redisRateLimiter.userKeyGenerator,
  }),

  // Product search rate limiter - 30 requests per minute
  search: redisRateLimiter.middleware({
    keyPrefix: 'search',
    points: 30,
    duration: 60,
    keyGenerator: redisRateLimiter.defaultKeyGenerator,
  }),

  // Admin operations rate limiter - 20 requests per minute
  admin: redisRateLimiter.middleware({
    keyPrefix: 'admin',
    points: 20,
    duration: 60,
    keyGenerator: redisRateLimiter.userKeyGenerator,
  }),
};

module.exports = {
  RedisRateLimiter,
  redisRateLimiter,
  rateLimiters,
};
