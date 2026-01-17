"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CanadaPostService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanadaPostService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const redis_service_1 = require("src/common/redis/redis.service");
const canada_post_utils_1 = require("./canada-post.utils");
const shipment_response_dto_1 = require("../dto/shipment-response.dto");
let CanadaPostService = CanadaPostService_1 = class CanadaPostService {
    constructor(configService, httpService, redisService) {
        this.configService = configService;
        this.httpService = httpService;
        this.redisService = redisService;
        this.logger = new common_1.Logger(CanadaPostService_1.name);
    }
    onModuleInit() {
        this.initializeConfig();
    }
    initializeConfig() {
        const env = this.configService.get('CANADA_POST_ENV', 'development');
        const isProduction = env === 'production';
        this.config = {
            env,
            apiKey: isProduction
                ? this.configService.get('CANADA_POST_PROD_KEY', '')
                : this.configService.get('CANADA_POST_DEV_KEY', ''),
            secret: isProduction
                ? this.configService.get('CANADA_POST_PROD_SECRET', '')
                : this.configService.get('CANADA_POST_DEV_SECRET', ''),
            customerNumber: this.configService.get('CANADA_POST_CUSTOMER_NUMBER', ''),
            contractId: this.configService.get('CANADA_POST_CONTRACT_ID'),
            baseUrl: isProduction
                ? 'https://soa-gw.canadapost.ca'
                : 'https://ct.soa-gw.canadapost.ca',
        };
        if (!this.config.apiKey || !this.config.secret || !this.config.customerNumber) {
            this.logger.warn('Canada Post configuration is incomplete. Shipping features may not work correctly.');
        }
    }
    async createShipment(createShipmentDto) {
        const { orderId, sender, recipient, items, serviceCode, requiresSignature, isInsured, insuredValue } = createShipmentDto;
        try {
            const formattedSender = (0, canada_post_utils_1.formatAddress)(sender);
            const formattedRecipient = (0, canada_post_utils_1.formatAddress)(recipient);
            const packageDimensions = (0, canada_post_utils_1.calculatePackageDimensions)(items);
            const totalWeight = (0, canada_post_utils_1.calculateTotalWeight)(items);
            const shipmentRequest = {
                customerNumber: this.config.customerNumber,
                contractId: this.config.contractId,
                expectedMailingDate: new Date().toISOString().split('T')[0],
                sender: formattedSender,
                destination: formattedRecipient,
                parcelCharacteristics: {
                    weight: totalWeight,
                    dimensions: packageDimensions,
                },
                preferences: {
                    showPackingInstructions: true,
                    showPostageRate: true,
                    showInsuredValue: isInsured,
                },
                ...(requiresSignature && { options: { signatureRequired: true } }),
                ...(isInsured && insuredValue && {
                    options: {
                        coverage: true,
                        coverageAmount: insuredValue,
                        coverageCurrency: 'CAD'
                    }
                }),
            };
            const response = await this.makeRequest({
                method: 'POST',
                url: `${this.config.baseUrl}/rs/${this.config.customerNumber}/shipment`,
                data: shipmentRequest,
            });
            const shipmentResponse = {
                id: response.shipmentId,
                orderId: orderId.toString(),
                carrier: 'CANADA_POST',
                serviceName: response.serviceName,
                serviceCode: response.serviceCode,
                trackingNumber: response.trackingPin,
                trackingUrl: response.trackingUrl,
                labelUrl: response.labelUrl,
                returnLabelUrl: response.returnLabelUrl,
                cost: response.price.total,
                status: shipment_response_dto_1.ShipmentStatus.CREATED,
                sender: formattedSender,
                recipient: formattedRecipient,
                items: items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    weight: item.weight,
                    length: item.dimensions.length,
                    width: item.dimensions.width,
                    height: item.dimensions.height,
                    value: item.value,
                    sku: item.sku,
                })),
                estimatedDeliveryDate: response.expectedDeliveryDate,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            return shipmentResponse;
        }
        catch (error) {
            throw (0, canada_post_utils_1.handleCanadaPostError)(error, this.logger, 'createShipment');
        }
    }
    async trackShipment(trackingNumber) {
        try {
            const response = await this.makeRequest({
                method: 'GET',
                url: `${this.config.baseUrl}/vis/track/pin/${trackingNumber}/summary`,
            });
            const trackingResponse = {
                trackingNumber: response.trackingPin,
                carrier: 'CANADA_POST',
                status: this.mapTrackingStatus(response.deliveryStatus.status),
                statusDescription: response.deliveryStatus.description,
                estimatedDeliveryDate: response.deliveryStatus.expectedDeliveryDate,
                actualDeliveryDate: response.deliveryStatus.actualDeliveryDate,
                events: response.events.map(event => ({
                    status: event.eventType,
                    description: event.eventDescription,
                    timestamp: event.eventDateTime,
                    location: event.location,
                    details: event.details,
                })),
            };
            return trackingResponse;
        }
        catch (error) {
            throw (0, canada_post_utils_1.handleCanadaPostError)(error, this.logger, 'trackShipment');
        }
    }
    async getRates(rateRequest) {
    }
    async makeRequest(options) {
        const { method, url, data, params, headers = {} } = options;
        const authString = Buffer.from(`${this.config.apiKey}:${this.config.secret}`).toString('base64');
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Basic ${authString}`,
            'Accept-language': 'en-CA',
        };
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.request({
                method,
                url,
                data,
                params,
                headers: { ...defaultHeaders, ...headers },
            }));
            return response.data;
        }
        catch (error) {
            throw (0, canada_post_utils_1.handleCanadaPostError)(error, this.logger, `${method} ${url}`);
        }
    }
    mapTrackingStatus(canadaPostStatus) {
        const statusMap = {
            'in_transit': shipment_response_dto_1.ShipmentStatus.IN_TRANSIT,
            'out_for_delivery': shipment_response_dto_1.ShipmentStatus.OUT_FOR_DELIVERY,
            'delivered': shipment_response_dto_1.ShipmentStatus.DELIVERED,
            'available_for_pickup': shipment_response_dto_1.ShipmentStatus.AVAILABLE_FOR_PICKUP,
            'return_to_sender': shipment_response_dto_1.ShipmentStatus.RETURNED,
            'exception': shipment_response_dto_1.ShipmentStatus.EXCEPTION,
            'not_found': shipment_response_dto_1.ShipmentStatus.NOT_FOUND,
        };
        return statusMap[canadaPostStatus.toLowerCase()] || shipment_response_dto_1.ShipmentStatus.UNKNOWN;
    }
};
exports.CanadaPostService = CanadaPostService;
exports.CanadaPostService = CanadaPostService = CanadaPostService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService, typeof (_a = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _a : Object])
], CanadaPostService);
//# sourceMappingURL=canada-post.service.js.map