"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
class CacheService {
    constructor() {
        this.isConnected = false;
        this.client = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 5) {
                        logger_1.logger.error('Too many reconnection attempts. Giving up.');
                        return new Error('Max reconnection attempts reached');
                    }
                    // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1.6s, 3.2s
                    return Math.min(retries * 100, 3200);
                },
            },
        });
        this.setupEventListeners();
    }
    static getInstance() {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }
    setupEventListeners() {
        this.client.on('connect', () => {
            logger_1.logger.info('Redis client connecting...');
        });
        this.client.on('ready', () => {
            this.isConnected = true;
            logger_1.logger.info('Redis client connected and ready');
        });
        this.client.on('error', (err) => {
            logger_1.logger.error('Redis client error:', err);
            this.isConnected = false;
        });
        this.client.on('reconnecting', () => {
            logger_1.logger.info('Redis client reconnecting...');
        });
    }
    async connect() {
        if (!this.isConnected) {
            try {
                await this.client.connect();
            }
            catch (error) {
                logger_1.logger.error('Failed to connect to Redis:', error);
                throw error;
            }
        }
    }
    generateRateCacheKey(params) {
        const { originPostalCode, destinationPostalCode, dimensions } = params;
        const { length, width, height, weight } = dimensions;
        // Normalize postal codes by removing spaces and converting to uppercase
        const origin = originPostalCode.replace(/\s+/g, '').toUpperCase();
        const destination = destinationPostalCode.replace(/\s+/g, '').toUpperCase();
        return `shipping:${origin}:${destination}:${length}x${width}x${height}:${weight}`;
    }
    async getShippingRates(params) {
        try {
            const key = this.generateRateCacheKey(params);
            const cached = await this.client.get(key);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            logger_1.logger.error('Error getting shipping rates from cache:', error);
            return null;
        }
    }
    async cacheShippingRates(params, rates, ttlSeconds = 1800 // Default 30 minutes
    ) {
        try {
            const key = this.generateRateCacheKey(params);
            await this.client.setEx(key, ttlSeconds, JSON.stringify(rates));
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error caching shipping rates:', error);
            return false;
        }
    }
    async invalidateShippingRates(params) {
        try {
            const key = this.generateRateCacheKey(params);
            const result = await this.client.del(key);
            return result > 0;
        }
        catch (error) {
            logger_1.logger.error('Error invalidating shipping rates cache:', error);
            return false;
        }
    }
    async getShipment(trackingNumber) {
        try {
            const key = `shipment:${trackingNumber}`;
            const cached = await this.client.get(key);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            logger_1.logger.error('Error getting shipment from cache:', error);
            return null;
        }
    }
    async cacheShipment(trackingNumber, data, ttlSeconds = 86400 // Default 24 hours
    ) {
        try {
            const key = `shipment:${trackingNumber}`;
            await this.client.setEx(key, ttlSeconds, JSON.stringify(data));
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error caching shipment:', error);
            return false;
        }
    }
    async invalidateShipment(trackingNumber) {
        try {
            const key = `shipment:${trackingNumber}`;
            const result = await this.client.del(key);
            return result > 0;
        }
        catch (error) {
            logger_1.logger.error('Error invalidating shipment cache:', error);
            return false;
        }
    }
    async disconnect() {
        if (this.isConnected) {
            try {
                await this.client.quit();
                this.isConnected = false;
            }
            catch (error) {
                logger_1.logger.error('Error disconnecting from Redis:', error);
            }
        }
    }
}
exports.CacheService = CacheService;
exports.cacheService = CacheService.getInstance();
