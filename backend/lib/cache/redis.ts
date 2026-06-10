import Redis from 'ioredis'

// Redis client singleton
let redisClient: Redis | null = null

export function getRedisClient(): Redis | null {
  // Redis is optional - only connect if REDIS_URL is provided
  if (!process.env.REDIS_URL) {
    return null
  }

  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      enableOfflineQueue: false
    })

    redisClient.on('error', (err) => {
      // Silently handle Redis errors - it's optional
      console.error('Redis connection error:', err)
    })

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully')
    })
  }
  
  return redisClient
}

// Cache utility functions
export class CacheService {
  private redis: Redis

  constructor() {
    const client = getRedisClient()
    if (!client) {
      throw new Error('Redis is not configured')
    }
    this.redis = client
  }

  // Get cached data
  async get(key: string): Promise<any> {
    try {
      const data = await this.redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  // Set cached data with TTL (seconds)
  async set(key: string, data: any, ttl: number): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(data))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  // Delete cached data
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  // Delete multiple keys by pattern
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error)
    }
  }

  // Clear all cache
  async clear(): Promise<void> {
    try {
      await this.redis.flushdb()
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  // Test Redis connection
  async testConnection(): Promise<boolean> {
    try {
      await this.redis.ping()
      return true
    } catch (error) {
      console.error('Redis connection test failed:', error)
      return false
    }
  }
}

// Cache configuration
export const CACHE_CONFIG = {
  PRODUCTS_LIST: {
    key: 'products:list',
    ttl: 300 // 5 minutes
  },
  CATEGORIES_LIST: {
    key: 'categories:list',
    ttl: 600 // 10 minutes
  },
  CATEGORY_TREE: {
    key: 'categories:tree',
    ttl: 600 // 10 minutes
  }
}

// Cache invalidation patterns
export const CACHE_PATTERNS = {
  PRODUCTS: 'products:*',
  CATEGORIES: 'categories:*',
  ALL: '*'
}

// Export factory function instead of default instance
export function getCacheService(): CacheService | null {
  try {
    return new CacheService()
  } catch (error) {
    return null
  }
}

export default getCacheService()
