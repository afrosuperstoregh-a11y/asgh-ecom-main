"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const redis_1 = require("redis");
let RedisService = RedisService_1 = class RedisService {
    constructor() {
        this.logger = new common_1.Logger(RedisService_1.name);
        this.isConnected = false;
    }
    async onModuleInit() {
        try {
            this.client = (0, redis_1.createClient)({
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
        }
        catch (error) {
            this.logger.error('Failed to connect to Redis', error);
            this.isConnected = false;
        }
    }
    async onModuleDestroy() {
        if (this.client && this.isConnected) {
            try {
                await this.client.quit();
                this.isConnected = false;
            }
            catch (error) {
                this.logger.error('Error disconnecting from Redis', error);
            }
        }
    }
    ensureConnected() {
        if (!this.isConnected || !this.client) {
            throw new Error('Redis client is not connected');
        }
    }
    async get(key) {
        try {
            this.ensureConnected();
            return await this.client.get(key);
        }
        catch (error) {
            this.logger.error(`Error getting key ${key} from Redis`, error);
            throw error;
        }
    }
    async set(key, value, ttl) {
        try {
            this.ensureConnected();
            if (ttl) {
                return await this.client.set(key, value, { EX: ttl });
            }
            return await this.client.set(key, value);
        }
        catch (error) {
            this.logger.error(`Error setting key ${key} in Redis`, error);
            throw error;
        }
    }
    async del(key) {
        try {
            this.ensureConnected();
            return await this.client.del(key);
        }
        catch (error) {
            this.logger.error(`Error deleting key ${key} from Redis`, error);
            throw error;
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)()
], RedisService);
//# sourceMappingURL=redis.services.js.map