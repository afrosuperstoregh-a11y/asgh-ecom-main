// Serverless-compatible Redis connection using Upstash
import { Redis } from '@upstash/redis';

// Create a singleton Redis connection for serverless
let redis: Redis | null = null;
let redisEnabled = process.env.REDIS_ENABLED === 'true';

export function getRedis(): Redis | null {
  if (!redisEnabled) {
    console.log('ℹ️ Redis is disabled in frontend');
    return null;
  }

  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    const redisToken = process.env.REDIS_TOKEN;
    
    if (!redisUrl || !redisToken) {
      console.log('ℹ️ REDIS_URL or REDIS_TOKEN not set, Redis disabled');
      redisEnabled = false;
      return null;
    }
    
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  }
  return redis;
}

// Helper functions for common Redis operations
export const redisCache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = getRedis();
      if (!redis) return null;
      
      const value = await redis.get(key);
      return value && typeof value === 'string' ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  },
  
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const redis = getRedis();
      if (!redis) return;
      
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  },
  
  async del(key: string): Promise<void> {
    try {
      const redis = getRedis();
      if (!redis) return;
      
      await redis.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  },
  
  async exists(key: string): Promise<boolean> {
    try {
      const redis = getRedis();
      if (!redis) return false;
      
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }
};
