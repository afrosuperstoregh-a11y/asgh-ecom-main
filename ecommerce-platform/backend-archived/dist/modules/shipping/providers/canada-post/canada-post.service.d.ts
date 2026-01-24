import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RedisService } from '@/common/redis/redis.services';
import { CreateShipmentDto } from '@/modules/shipping/dto/create-shipment.dto';
import { ShipmentResponseDto, TrackShipmentResponseDto } from '@/modules/shipping/dto/shipment-response.dto';
export declare class CanadaPostService implements OnModuleInit {
    private readonly configService;
    private readonly httpService;
    private readonly redisService;
    private readonly logger;
    private config;
    constructor(configService: ConfigService, httpService: HttpService, redisService: RedisService);
    onModuleInit(): void;
    private initializeConfig;
    createShipment(createShipmentDto: CreateShipmentDto): Promise<ShipmentResponseDto>;
    trackShipment(trackingNumber: string): Promise<TrackShipmentResponseDto>;
    getRates(rateRequest: any): Promise<any>;
    private makeRequest;
    private mapTrackingStatus;
}
