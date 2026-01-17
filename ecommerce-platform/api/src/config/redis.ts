import { createClient } from 'redis';

class RedisClient {
  private client: ReturnType<typeof createClient>;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || undefined,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      console.log('Redis Client Ready');
    });

    this.client.on('end', () => {
      console.log('Redis Client Disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  // Basic operations
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  // Hash operations
  async hGet(key: string, field: string): Promise<string | undefined> {
    return await this.client.hGet(key, field);
  }

  async hSet(key: string, field: string, value: string): Promise<number> {
    return await this.client.hSet(key, field, value);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return await this.client.hGetAll(key);
  }

  async hDel(key: string, field: string): Promise<number> {
    return await this.client.hDel(key, field);
  }

  // JSON operations (for complex objects)
  async setJSON(key: string, value: any, ttl?: number): Promise<void> {
    const jsonString = JSON.stringify(value);
    await this.set(key, jsonString, ttl);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Error parsing JSON from Redis:', error);
      return null;
    }
  }

  // Cache helpers
  async cacheProduct(productId: string, productData: any): Promise<void> {
    await this.setJSON(`product:${productId}`, productData, 1800); // 30 minutes
  }

  async getCachedProduct(productId: string): Promise<any | null> {
    return await this.getJSON(`product:${productId}`);
  }

  async cacheProductsList(cacheKey: string, products: any[]): Promise<void> {
    await this.setJSON(cacheKey, products, 3600); // 1 hour
  }

  async getCachedProductsList(cacheKey: string): Promise<any[] | null> {
    return await this.getJSON(cacheKey);
  }

  async cacheUserSession(sessionId: string, sessionData: any): Promise<void> {
    await this.setJSON(`session:${sessionId}`, sessionData, 86400); // 24 hours
  }

  async getCachedUserSession(sessionId: string): Promise<any | null> {
    return await this.getJSON(`session:${sessionId}`);
  }

  async cacheCart(userId: string | null, sessionId: string, cartData: any): Promise<void> {
    const key = userId ? `cart:user:${userId}` : `cart:session:${sessionId}`;
    await this.setJSON(key, cartData, 86400); // 24 hours
  }

  async getCachedCart(userId: string | null, sessionId: string): Promise<any | null> {
    const key = userId ? `cart:user:${userId}` : `cart:session:${sessionId}`;
    return await this.getJSON(key);
  }

  async invalidateCart(userId: string | null, sessionId: string): Promise<void> {
    const key = userId ? `cart:user:${userId}` : `cart:session:${sessionId}`;
    await this.del(key);
  }

  // Rate limiting
  async incrementRateLimit(identifier: string, windowMs: number): Promise<number> {
    const key = `rate_limit:${identifier}`;
    const current = await this.client.incr(key);
    
    if (current === 1) {
      await this.client.expire(key, Math.ceil(windowMs / 1000));
    }
    
    return current;
  }

  // Search cache
  async cacheSearchResults(query: string, results: any[]): Promise<void> {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    await this.setJSON(key, results, 900); // 15 minutes
  }

  async getCachedSearchResults(query: string): Promise<any[] | null> {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    return await this.getJSON(key);
  }

  // Health check
  async ping(): Promise<string> {
    return await this.client.ping();
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const redisClient = new RedisClient();

// Initialize Redis connection
export const initializeRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    await redisClient.ping();
    console.log('Redis initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    // Don't throw error to allow app to start without Redis
    // Redis operations will fail gracefully
  }
};
