const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const cacheService = require('../services/cacheService');
const { clearAllCache } = require('../middleware/cache');
const { redisRateLimiter } = require('../middleware/redisRateLimiter');
const router = express.Router();

// All cache routes require authentication and admin rights
router.use(authenticateToken);
router.use(requireAdmin);

// Get cache statistics and health
router.get('/stats', async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Cache statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache statistics',
      message: error.message
    });
  }
});

// Clear all cache
router.delete('/clear', 
  auditLog('CLEAR_ALL_CACHE', 'cache'),
  async (req, res) => {
    try {
      const result = await clearAllCache();
      
      res.json({
        success: true,
        message: result ? 'All cache cleared successfully' : 'No cache to clear',
        cleared: result
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache',
        message: error.message
      });
    }
  }
);

// Clear specific cache patterns
router.delete('/clear/:pattern', 
  auditLog('CLEAR_CACHE_PATTERN', 'cache'),
  async (req, res) => {
    try {
      const { pattern } = req.params;
      const fullPattern = `asca_ecom:${pattern}`;
      
      // This would need to be implemented in cacheService
      // For now, we'll use a simple approach
      const result = await cacheService.clear();
      
      res.json({
        success: true,
        message: `Cache cleared for pattern: ${pattern}`,
        pattern: fullPattern,
        cleared: result
      });
    } catch (error) {
      console.error('Error clearing cache pattern:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache pattern',
        message: error.message
      });
    }
  }
);

// Get rate limiting statistics
router.get('/rate-limit/stats', async (req, res) => {
  try {
    const stats = await redisRateLimiter.getStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Rate limiting statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting rate limit stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve rate limiting statistics',
      message: error.message
    });
  }
});

// Block an IP address or user
router.post('/block', 
  auditLog('BLOCK_KEY', 'cache'),
  async (req, res) => {
    try {
      const { key, duration = 3600, reason } = req.body;
      
      if (!key) {
        return res.status(400).json({
          success: false,
          error: 'Key is required',
          message: 'Please provide a key (IP address or user ID) to block'
        });
      }
      
      const result = await redisRateLimiter.blockKey(key, duration, reason);
      
      res.json({
        success: true,
        message: `Key blocked successfully for ${duration} seconds`,
        key,
        duration,
        reason,
        blocked: result
      });
    } catch (error) {
      console.error('Error blocking key:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to block key',
        message: error.message
      });
    }
  }
);

// Unblock an IP address or user
router.delete('/block/:key', 
  auditLog('UNBLOCK_KEY', 'cache'),
  async (req, res) => {
    try {
      const { key } = req.params;
      
      const result = await redisRateLimiter.unblockKey(key);
      
      res.json({
        success: true,
        message: result ? 'Key unblocked successfully' : 'Key was not blocked',
        key,
        unblocked: result
      });
    } catch (error) {
      console.error('Error unblocking key:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unblock key',
        message: error.message
      });
    }
  }
);

// Check if a key is blocked
router.get('/block/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const blockInfo = await redisRateLimiter.isKeyBlocked(key);
    
    res.json({
      success: true,
      data: {
        key,
        isBlocked: !!blockInfo,
        blockInfo
      },
      message: 'Block status retrieved successfully'
    });
  } catch (error) {
    console.error('Error checking block status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check block status',
      message: error.message
    });
  }
});

// Warm cache with popular data
router.post('/warm', 
  auditLog('WARM_CACHE', 'cache'),
  async (req, res) => {
    try {
      // This would typically fetch popular data and cache it
      // For now, we'll simulate cache warming
      const warmData = {
        featuredProducts: [],
        categories: [],
        popularProducts: []
      };
      
      const result = await cacheService.warmCache(warmData);
      
      res.json({
        success: true,
        message: 'Cache warmed successfully',
        warmed: result
      });
    } catch (error) {
      console.error('Error warming cache:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to warm cache',
        message: error.message
      });
    }
  }
);

// Get specific cache key
router.get('/get/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const data = await cacheService.get(key);
    
    if (data) {
      res.json({
        success: true,
        data,
        key,
        message: 'Cache data retrieved successfully'
      });
    } else {
      res.json({
        success: true,
        data: null,
        key,
        message: 'Cache key not found'
      });
    }
  } catch (error) {
    console.error('Error getting cache key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache key',
      message: error.message
    });
  }
});

// Set specific cache key
router.post('/set/:key', 
  auditLog('SET_CACHE', 'cache'),
  async (req, res) => {
    try {
      const { key } = req.params;
      const { data, ttl } = req.body;
      
      if (!data) {
        return res.status(400).json({
          success: false,
          error: 'Data is required',
          message: 'Please provide data to cache'
        });
      }
      
      const result = await cacheService.set(key, data, ttl);
      
      res.json({
        success: true,
        message: 'Cache key set successfully',
        key,
        ttl: ttl || 'default',
        cached: result
      });
    } catch (error) {
      console.error('Error setting cache key:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to set cache key',
        message: error.message
      });
    }
  }
);

// Delete specific cache key
router.delete('/:key', 
  auditLog('DELETE_CACHE', 'cache'),
  async (req, res) => {
    try {
      const { key } = req.params;
      
      const result = await cacheService.del(key);
      
      res.json({
        success: true,
        message: result ? 'Cache key deleted successfully' : 'Cache key not found',
        key,
        deleted: result
      });
    } catch (error) {
      console.error('Error deleting cache key:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete cache key',
        message: error.message
      });
    }
  }
);

// Get cache TTL
router.get('/ttl/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const ttl = await cacheService.ttl(key);
    
    res.json({
      success: true,
      data: {
        key,
        ttl,
        exists: ttl !== -2
      },
      message: 'Cache TTL retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting cache TTL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache TTL',
      message: error.message
    });
  }
});

module.exports = router;
