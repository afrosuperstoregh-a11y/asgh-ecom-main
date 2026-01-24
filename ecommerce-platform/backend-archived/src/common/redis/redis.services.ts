// src/common/redis/redis.service.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

type RedisSetResponse = 'OK' | null;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;
  private isConnected = false;

  async onModuleInit() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis Client Error', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.log('Connected to Redis');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.isConnected = false;
      } catch (error) {
        this.logger.error('Error disconnecting from Redis', error);
      }
    }
  }

  private ensureConnected(): void {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis client is not connected');
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      this.ensureConnected();
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key} from Redis`, error);
      throw error;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<RedisSetResponse> {
    try {
      this.ensureConnected();
      if (ttl) {
        return await this.client.set(key, value, { EX: ttl }) as RedisSetResponse;
      }
      return await this.client.set(key, value) as RedisSetResponse;
    } catch (error) {
      this.logger.error(`Error setting key ${key} in Redis`, error);
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      this.ensureConnected();
      return await this.client.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key} from Redis`, error);
      throw error;
    }
  }
}