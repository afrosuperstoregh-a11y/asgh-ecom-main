const { redis } = require('../config/redis');
const crypto = require('crypto');

class CacheMiddleware {
  constructor(options = {}) {
    this.defaultTTL = options.defaultTTL || 300; // 5 minutes
    this.enabled = options.enabled !== false;
    this.keyPrefix = options.keyPrefix || 'cache:';
    this.skipMethods = options.skipMethods || ['POST', 'PUT', 'DELETE', 'PATCH'];
  }

  // Generate cache key based on request
  generateCacheKey(req) {
    const url = req.originalUrl || req.url;
    const method = req.method;
    const user = req.user?.id || 'anonymous';
    const query = JSON.stringify(req.query);
    const params = JSON.stringify(req.params);
    
    const keyData = `${method}:${url}:${user}:${query}:${params}`;
    const hash = crypto.createHash('md5').update(keyData).digest('hex');
    
    return `${this.keyPrefix}${hash}`;
  }

  // Check if request should be cached
  shouldCache(req) {
    // Skip if caching is disabled
    if (!this.enabled) return false;
    
    // Skip non-GET requests
    if (this.skipMethods.includes(req.method)) return false;
    
    // Skip if no-cache header is present
    if (req.headers['cache-control'] === 'no-cache') return false;
    
    // Skip if authorization header is present (for sensitive data)
    if (req.headers.authorization && !this.cacheAuthenticated) return false;
    
    return true;
  }

  // Main cache middleware
  middleware(options = {}) {
    const ttl = options.ttl || this.defaultTTL;
    const cacheAuthenticated = options.cacheAuthenticated || false;
    
    return async (req, res, next) => {
      // Skip if caching should not be applied
      if (!this.shouldCache(req)) {
        return next();
      }

      try {
        const cacheKey = this.generateCacheKey(req);
        const client = redis();
        
        if (!client) {
          return next();
        }

        // Try to get cached response
        const cachedData = await client.get(cacheKey);
        
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          
          // Set cache headers
          res.set('X-Cache', 'HIT');
          res.set('X-Cache-Key', cacheKey);
          res.set('Cache-Control', `public, max-age=${ttl}`);
          
          // Return cached response
          return res.json(parsedData);
        }

        // Cache miss - intercept response
        const originalJson = res.json;
        const originalSend = res.send;
        let responseData = null;

        res.json = function(data) {
          responseData = data;
          return originalJson.call(this, data);
        };

        res.send = function(data) {
          responseData = data;
          return originalSend.call(this, data);
        };

        // Continue to next middleware
        res.on('finish', async () => {
          try {
            // Only cache successful responses
            if (res.statusCode === 200 && responseData) {
              await client.setex(cacheKey, ttl, JSON.stringify(responseData));
              
              // Set cache headers
              res.set('X-Cache', 'MISS');
              res.set('X-Cache-Key', cacheKey);
              res.set('Cache-Control', `public, max-age=${ttl}`);
            }
          } catch (error) {
            console.error('Cache write error:', error);
          }
        });

        next();
      } catch (error) {
        console.error('Cache middleware error:', error);
        next();
      }
    };
  }

  // Cache invalidation middleware
  invalidate(patterns) {
    return async (req, res, next) => {
      const originalJson = res.json;
      const originalSend = res.send;

      res.json = function(data) {
        // Invalidate cache after successful response
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setImmediate(() => {
            CacheMiddleware.invalidatePatterns(patterns);
          });
        }
        return originalJson.call(this, data);
      };

      res.send = function(data) {
        // Invalidate cache after successful response
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setImmediate(() => {
            CacheMiddleware.invalidatePatterns(patterns);
          });
        }
        return originalSend.call(this, data);
      };

      next();
    };
  }

  // Static method to invalidate cache patterns
  static async invalidatePatterns(patterns) {
    try {
      const client = redis();
      if (!client) return;

      for (const pattern of patterns) {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          await client.del(...keys);
          console.log(`🗑️ Invalidated ${keys.length} cache keys for pattern: ${pattern}`);
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  // Clear all cache
  static async clearAll() {
    try {
      const client = redis();
      if (!client) return false;

      const keys = await client.keys('cache:*');
      if (keys.length > 0) {
        await client.del(...keys);
        console.log(`🗑️ Cleared ${keys.length} cache keys`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }
}

// Predefined cache configurations
const cacheConfigs = {
  // Products cache - 5 minutes
  products: new CacheMiddleware({
    ttl: 300,
    cacheAuthenticated: true,
    keyPrefix: 'cache:products:'
  }),

  // Categories cache - 30 minutes
  categories: new CacheMiddleware({
    ttl: 1800,
    cacheAuthenticated: true,
    keyPrefix: 'cache:categories:'
  }),

  // Product details - 10 minutes
  productDetails: new CacheMiddleware({
    ttl: 600,
    cacheAuthenticated: true,
    keyPrefix: 'cache:product:'
  }),

  // Homepage featured products - 5 minutes
  featuredProducts: new CacheMiddleware({
    ttl: 300,
    cacheAuthenticated: true,
    keyPrefix: 'cache:featured:'
  }),

  // User data - 2 minutes (shorter for frequently changing data)
  userData: new CacheMiddleware({
    ttl: 120,
    cacheAuthenticated: true,
    keyPrefix: 'cache:user:'
  })
};

// Cache invalidation patterns
const invalidationPatterns = {
  // Product-related patterns
  products: [
    'cache:products:*',
    'cache:featured:*',
    'cache:product:*'
  ],
  
  // Category-related patterns
  categories: [
    'cache:categories:*',
    'cache:products:*'
  ],
  
  // User-related patterns
  users: [
    'cache:user:*'
  ]
};

module.exports = {
  CacheMiddleware,
  cacheConfigs,
  invalidationPatterns,
  
  // Convenience functions
  cacheMiddleware: (config) => cacheConfigs[config]?.middleware() || new CacheMiddleware().middleware(),
  invalidateCache: (patterns) => CacheMiddleware.invalidatePatterns(patterns),
  clearAllCache: () => CacheMiddleware.clearAll()
};
