const Redis = require('ioredis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isEnabled = process.env.REDIS_ENABLED === 'true';
  }

  connect() {
    // Redis is optional - only connect if REDIS_URL is provided
    if (!process.env.REDIS_URL) {
      console.log('⚠️  Redis disabled (REDIS_URL not set)');
      this.isEnabled = false;
      return null;
    }

    if (!this.isEnabled) {
      console.log('⚠️  Redis disabled (REDIS_ENABLED=false)');
      return null;
    }

    try {
      this.client = new Redis({
        url: process.env.REDIS_URL,
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
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
        // Silently handle Redis errors - it's optional
        console.error('Redis connection error:', err.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
      });

      return this.client;
    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error.message);
      return null;
    }
  }

  async testConnection() {
    if (!this.isEnabled || !process.env.REDIS_URL) {
      console.log('⚠️  Redis disabled - skipping connection test');
      return false; // Return false to indicate Redis is not available
    }

    try {
      if (!this.client) {
        this.client = this.connect();
      }

      if (!this.client) {
        return false;
      }

      await this.client.ping();
      console.log('✅ Redis connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Redis connection test failed:', error.message);
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
