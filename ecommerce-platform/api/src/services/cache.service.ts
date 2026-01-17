import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

type CacheKey = `shipping:${string}:${string}:${number}x${number}x${number}:${number}`;

export class CacheService {
  private client: RedisClientType;
  private static instance: CacheService;
  private isConnected: boolean = false;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            logger.error('Too many reconnection attempts. Giving up.');
            return new Error('Max reconnection attempts reached');
          }
          // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1.6s, 3.2s
          return Math.min(retries * 100, 3200);
        },
      },
    });

    this.setupEventListeners();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private setupEventListeners(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('Redis client connected and ready');
    });

    this.client.on('error', (err) => {
      logger.error('Redis client error:', err);
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
      } catch (error) {
        logger.error('Failed to connect to Redis:', error);
        throw error;
      }
    }
  }

  private generateRateCacheKey(params: {
    originPostalCode: string;
    destinationPostalCode: string;
    dimensions: { length: number; width: number; height: number; weight: number };
  }): CacheKey {
    const { originPostalCode, destinationPostalCode, dimensions } = params;
    const { length, width, height, weight } = dimensions;
    
    // Normalize postal codes by removing spaces and converting to uppercase
    const origin = originPostalCode.replace(/\s+/g, '').toUpperCase();
    const destination = destinationPostalCode.replace(/\s+/g, '').toUpperCase();
    
    return `shipping:${origin}:${destination}:${length}x${width}x${height}:${weight}`;
  }

  public async getShippingRates(params: {
    originPostalCode: string;
    destinationPostalCode: string;
    dimensions: { length: number; width: number; height: number; weight: number };
  }): Promise<any[] | null> {
    try {
      const key = this.generateRateCacheKey(params);
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Error getting shipping rates from cache:', error);
      return null;
    }
  }

  public async cacheShippingRates(
    params: {
      originPostalCode: string;
      destinationPostalCode: string;
      dimensions: { length: number; width: number; height: number; weight: number };
    },
    rates: any[],
    ttlSeconds: number = 1800 // Default 30 minutes
  ): Promise<boolean> {
    try {
      const key = this.generateRateCacheKey(params);
      await this.client.setEx(key, ttlSeconds, JSON.stringify(rates));
      return true;
    } catch (error) {
      logger.error('Error caching shipping rates:', error);
      return false;
    }
  }

  public async invalidateShippingRates(params: {
    originPostalCode: string;
    destinationPostalCode: string;
    dimensions: { length: number; width: number; height: number; weight: number };
  }): Promise<boolean> {
    try {
      const key = this.generateRateCacheKey(params);
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Error invalidating shipping rates cache:', error);
      return false;
    }
  }

  public async getShipment(trackingNumber: string): Promise<any | null> {
    try {
      const key = `shipment:${trackingNumber}`;
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Error getting shipment from cache:', error);
      return null;
    }
  }

  public async cacheShipment(
    trackingNumber: string,
    data: any,
    ttlSeconds: number = 86400 // Default 24 hours
  ): Promise<boolean> {
    try {
      const key = `shipment:${trackingNumber}`;
      await this.client.setEx(key, ttlSeconds, JSON.stringify(data));
      return true;
    } catch (error) {
      logger.error('Error caching shipment:', error);
      return false;
    }
  }

  public async invalidateShipment(trackingNumber: string): Promise<boolean> {
    try {
      const key = `shipment:${trackingNumber}`;
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Error invalidating shipment cache:', error);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.client.quit();
        this.isConnected = false;
      } catch (error) {
        logger.error('Error disconnecting from Redis:', error);
      }
    }
  }
}

export const cacheService = CacheService.getInstance();
