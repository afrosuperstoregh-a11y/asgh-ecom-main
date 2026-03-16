const Redis = require('ioredis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isEnabled = process.env.REDIS_ENABLED === 'true';
  }

  connect() {
    if (!this.isEnabled) {
      console.log('ℹ️ Redis is disabled');
      return null;
    }

    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'asca_ecom:',
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis connection error:', err);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('🔌 Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
      });

      return this.client;
    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error);
      return null;
    }
  }

  async testConnection() {
    if (!this.isEnabled) {
      console.log('ℹ️ Redis is disabled, skipping connection test');
      return true;
    }

    try {
      if (!this.client) {
        this.client = this.connect();
      }
      
      await this.client.ping();
      console.log('✅ Redis connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Redis connection test failed:', error);
      return false;
    }
  }

  getClient() {
    if (!this.isEnabled) {
      console.log('ℹ️ Redis is disabled, returning null client');
      return null;
    }

    if (!this.client) {
      this.client = this.connect();
    }
    return this.client;
  }

  isReady() {
    return this.isEnabled && this.isConnected && this.client && this.client.status === 'ready';
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }
}

const redisClient = new RedisClient();

module.exports = {
  redis: redisClient.getClient.bind(redisClient),
  testConnection: redisClient.testConnection.bind(redisClient),
  isReady: redisClient.isReady.bind(redisClient),
  disconnect: redisClient.disconnect.bind(redisClient),
};
