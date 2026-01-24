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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanadaPostController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const canada_post_service_1 = require("../providers/canada-post/canada-post.service");
const shipping_rate_request_dto_1 = require("../dto/shipping-rate-request.dto");
const shipping_rate_response_dto_1 = require("../dto/shipping-rate-response.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const user_role_enum_1 = require("../../users/enums/user-role.enum");
let CanadaPostController = class CanadaPostController {
    constructor(canadaPostService) {
        this.canadaPostService = canadaPostService;
    }
    async getRates(rateRequest) {
        try {
            const rates = await this.canadaPostService.getRates({
                originPostalCode: rateRequest.originPostalCode,
                destinationPostalCode: rateRequest.destinationPostalCode,
                weight: rateRequest.weight,
                dimensions: rateRequest.dimensions,
            });
            if (rates.length > 0) {
                const sortedByPrice = [...rates].sort((a, b) => a.price - b.price);
                const cheapestRate = sortedByPrice[0];
                const sortedByDelivery = [...rates].sort((a, b) => a.deliveryDays - b.deliveryDays || a.price - b.price);
                const fastestRate = sortedByDelivery[0];
                rates.forEach(rate => {
                    rate.isCheapest = rate.serviceCode === cheapestRate.serviceCode;
                    rate.isFastest = rate.serviceCode === fastestRate.serviceCode;
                });
            }
            return {
                rates,
                originPostalCode: rateRequest.originPostalCode,
                destinationPostalCode: rateRequest.destinationPostalCode,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to get shipping rates',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createShipment() {
        throw new Error('Not implemented');
    }
    async trackShipment(trackingNumber) {
        try {
            const trackingInfo = await this.canadaPostService.trackShipment(trackingNumber);
            return trackingInfo;
        }
        catch (error) {
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.NOT_FOUND,
                message: 'Tracking information not found',
                error: error.message,
            }, common_1.HttpStatus.NOT_FOUND);
        }
    }
};
exports.CanadaPostController = CanadaPostController;
__decorate([
    (0, common_1.Post)('rates'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.CUSTOMER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get shipping rates' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Returns available shipping rates',
        type: shipping_rate_response_dto_1.ShippingRatesResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid request parameters',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized',
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Failed to get shipping rates',
    }),
    openapi.ApiResponse({ status: 201, type: require("../dto/shipping-rate-response.dto").ShippingRatesResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shipping_rate_request_dto_1.ShippingRateRequestDto]),
    __metadata("design:returntype", Promise)
], CanadaPostController.prototype, "getRates", null);
__decorate([
    (0, common_1.Post)('shipments'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new shipment' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Shipment created successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid shipment data',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized',
    }),
    openapi.ApiResponse({ status: 201 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CanadaPostController.prototype, "createShipment", null);
__decorate([
    (0, common_1.Get)('track/:trackingNumber'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.CUSTOMER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Track a shipment' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns tracking information',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Tracking number not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized',
    }),
    openapi.ApiResponse({ status: 200, type: require("../dto/shipment-response.dto").TrackShipmentResponseDto }),
    __param(0, (0, common_1.Param)('trackingNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CanadaPostController.prototype, "trackShipment", null);
exports.CanadaPostController = CanadaPostController = __decorate([
    (0, swagger_1.ApiTags)('Shipping'),
    (0, common_1.Controller)('shipping/canada-post'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [canada_post_service_1.CanadaPostService])
], CanadaPostController);
//# sourceMappingURL=canada-post.controller.js.map