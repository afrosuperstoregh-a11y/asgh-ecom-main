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
exports.ShippingController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const shipping_service_1 = require("../shipping.service");
const create_shipment_dto_1 = require("../dto/create-shipment.dto");
const shipping_rate_request_dto_1 = require("../dto/shipping-rate-request.dto");
let ShippingController = class ShippingController {
    constructor(shippingService) {
        this.shippingService = shippingService;
    }
    async create(createShipmentDto) {
        return this.shippingService.create(createShipmentDto);
    }
    async findAll() {
        return this.shippingService.findAll();
    }
    async findOne(id) {
        return this.shippingService.findOne(id);
    }
    async update(id, updateShipmentDto) {
        return this.shippingService.update(id, updateShipmentDto);
    }
    async remove(id) {
        return this.shippingService.remove(id);
    }
    async getRates(id, rateRequest) {
        return this.shippingService.getRates(rateRequest);
    }
    async buyLabel(id) {
        return this.shippingService.buyLabel(id);
    }
};
exports.ShippingController = ShippingController;
__decorate([
    (0, common_1.Post)('shipments'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED, type: require("../dto/shipment-response.dto").ShipmentResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_shipment_dto_1.CreateShipmentDto]),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('shipments'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: [require("../dto/shipment-response.dto").ShipmentResponseDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('shipments/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: require("../dto/shipment-response.dto").ShipmentResponseDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)('shipments/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: require("../dto/shipment-response.dto").ShipmentResponseDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('shipments/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('shipments/:id/rates'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: require("../dto/shipping-rate-response.dto").ShippingRatesResponseDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, shipping_rate_request_dto_1.ShippingRateRequestDto]),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "getRates", null);
__decorate([
    (0, common_1.Post)('shipments/:id/buy'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "buyLabel", null);
exports.ShippingController = ShippingController = __decorate([
    (0, common_1.Controller)('shipping'),
    __metadata("design:paramtypes", [shipping_service_1.ShippingService])
], ShippingController);
//# sourceMappingURL=shipping.controller.js.map