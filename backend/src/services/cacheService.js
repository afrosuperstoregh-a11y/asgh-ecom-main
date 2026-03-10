const { redis } = require('../config/redis');

class CacheService {
  constructor() {
    this.defaultTTL = 300; // 5 minutes
    this.keyPrefix = 'asca_ecom:';
  }

  // Get cached data
  async get(key) {
    try {
      const client = redis();
      if (!client) return null;

      const fullKey = `${this.keyPrefix}${key}`;
      const data = await client.get(fullKey);
      
      if (data) {
        console.log(`🎯 Cache HIT: ${key}`);
        return JSON.parse(data);
      }
      
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Set cached data with optional TTL
  async set(key, data, ttl = this.defaultTTL) {
    try {
      const client = redis();
      if (!client) return false;

      const fullKey = `${this.keyPrefix}${key}`;
      const serializedData = JSON.stringify(data);
      
      if (ttl > 0) {
        await client.setex(fullKey, ttl, serializedData);
      } else {
        await client.set(fullKey, serializedData);
      }
      
      console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Delete cached data
  async del(key) {
    try {
      const client = redis();
      if (!client) return false;

      const fullKey = `${this.keyPrefix}${key}`;
      const result = await client.del(fullKey);
      
      if (result > 0) {
        console.log(`🗑️ Cache DEL: ${key}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Check if key exists
  async exists(key) {
    try {
      const client = redis();
      if (!client) return false;

      const fullKey = `${this.keyPrefix}${key}`;
      const result = await client.exists(fullKey);
      
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Get TTL of a key
  async ttl(key) {
    try {
      const client = redis();
      if (!client) return -1;

      const fullKey = `${this.keyPrefix}${key}`;
      return await client.ttl(fullKey);
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -1;
    }
  }

  // Increment a counter
  async incr(key, ttl = this.defaultTTL) {
    try {
      const client = redis();
      if (!client) return null;

      const fullKey = `${this.keyPrefix}${key}`;
      const result = await client.incr(fullKey);
      
      // Set TTL if it's a new key
      if (result === 1 && ttl > 0) {
        await client.expire(fullKey, ttl);
      }
      
      return result;
    } catch (error) {
      console.error('Cache increment error:', error);
      return null;
    }
  }

  // Get multiple keys
  async mget(keys) {
    try {
      const client = redis();
      if (!client) return [];

      const fullKeys = keys.map(key => `${this.keyPrefix}${key}`);
      const results = await client.mget(...fullKeys);
      
      return results.map(data => {
        if (data) {
          return JSON.parse(data);
        }
        return null;
      });
    } catch (error) {
      console.error('Cache mget error:', error);
      return [];
    }
  }

  // Set multiple keys
  async mset(keyValuePairs, ttl = this.defaultTTL) {
    try {
      const client = redis();
      if (!client) return false;

      const pipeline = client.pipeline();
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const fullKey = `${this.keyPrefix}${key}`;
        const serializedValue = JSON.stringify(value);
        
        if (ttl > 0) {
          pipeline.setex(fullKey, ttl, serializedValue);
        } else {
          pipeline.set(fullKey, serializedValue);
        }
      }
      
      await pipeline.exec();
      console.log(`💾 Cache MSET: ${Object.keys(keyValuePairs).length} keys`);
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  // Clear all cache with prefix
  async clear() {
    try {
      const client = redis();
      if (!client) return false;

      const pattern = `${this.keyPrefix}*`;
      const keys = await client.keys(pattern);
      
      if (keys.length > 0) {
        await client.del(...keys);
        console.log(`🗑️ Cache CLEAR: ${keys.length} keys removed`);
        return true;
      }
      
      console.log('📭 Cache CLEAR: No keys to remove');
      return false;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Get cache statistics
  async getStats() {
    try {
      const client = redis();
      if (!client) return null;

      const info = await client.info('memory');
      const keyspace = await client.info('keyspace');
      
      // Parse memory info
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const usedMemory = memoryMatch ? memoryMatch[1].trim() : 'unknown';
      
      // Count keys with our prefix
      const pattern = `${this.keyPrefix}*`;
      const keys = await client.keys(pattern);
      
      return {
        usedMemory,
        totalKeys: keys.length,
        keyPrefix: this.keyPrefix,
        connected: client.status === 'ready'
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  // Cache warming for popular data
  async warmCache(data) {
    try {
      const warmingData = {
        'products:featured': data.featuredProducts || [],
        'categories:all': data.categories || [],
        'products:popular': data.popularProducts || [],
      };

      await this.mset(warmingData, 300); // 5 minutes
      console.log('🔥 Cache warmed with popular data');
      return true;
    } catch (error) {
      console.error('Cache warming error:', error);
      return false;
    }
  }

  // Product-specific cache methods
  async getProduct(productId) {
    return this.get(`product:${productId}`);
  }

  async setProduct(productId, productData, ttl = 600) { // 10 minutes
    return this.set(`product:${productId}`, productData, ttl);
  }

  async deleteProduct(productId) {
    return this.del(`product:${productId}`);
  }

  // Category-specific cache methods
  async getCategories() {
    return this.get('categories:all');
  }

  async setCategories(categories, ttl = 1800) { // 30 minutes
    return this.set('categories:all', categories, ttl);
  }

  async deleteCategories() {
    return this.del('categories:all');
  }

  // Product list cache methods
  async getProductList(filters = '') {
    return this.get(`products:list:${filters}`);
  }

  async setProductList(filters, products, ttl = 300) { // 5 minutes
    return this.set(`products:list:${filters}`, products, ttl);
  }

  async deleteProductList(filters = '') {
    return filters ? this.del(`products:list:${filters}`) : this.clear();
  }

  // Shopping cart cache methods
  async getCart(userId) {
    return this.get(`cart:${userId}`);
  }

  async setCart(userId, cartData, ttl = 86400) { // 24 hours
    return this.set(`cart:${userId}`, cartData, ttl);
  }

  async deleteCart(userId) {
    return this.del(`cart:${userId}`);
  }

  // User session cache methods
  async getUserSession(userId) {
    return this.get(`session:${userId}`);
  }

  async setUserSession(userId, sessionData, ttl = 1800) { // 30 minutes
    return this.set(`session:${userId}`, sessionData, ttl);
  }

  async deleteUserSession(userId) {
    return this.del(`session:${userId}`);
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
