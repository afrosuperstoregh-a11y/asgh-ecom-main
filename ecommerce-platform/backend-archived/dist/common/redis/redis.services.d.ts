import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
type RedisSetResponse = 'OK' | null;
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private client;
    private isConnected;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private ensureConnected;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<RedisSetResponse>;
    del(key: string): Promise<number>;
}
export {};
