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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippingRatesResponseDto = exports.ShippingRateDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
class ShippingRateDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { serviceName: { required: true, type: () => String }, serviceCode: { required: true, type: () => String }, price: { required: true, type: () => Number }, deliveryDate: { required: true, type: () => String }, deliveryDays: { required: true, type: () => Number }, isFastest: { required: false, type: () => Boolean }, isCheapest: { required: false, type: () => Boolean } };
    }
}
exports.ShippingRateDto = ShippingRateDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Name of the shipping service',
        example: 'Expedited Parcel',
    }),
    __metadata("design:type", String)
], ShippingRateDto.prototype, "serviceName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique code for the shipping service',
        example: 'DOM.EP',
    }),
    __metadata("design:type", String)
], ShippingRateDto.prototype, "serviceCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Price of the shipping service in CAD',
        example: 12.99,
    }),
    __metadata("design:type", Number)
], ShippingRateDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Estimated delivery date in ISO format',
        example: '2023-06-15',
    }),
    __metadata("design:type", String)
], ShippingRateDto.prototype, "deliveryDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Estimated number of business days for delivery',
        example: 3,
    }),
    __metadata("design:type", Number)
], ShippingRateDto.prototype, "deliveryDays", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indicates if this is the fastest available option',
        example: false,
        required: false,
    }),
    __metadata("design:type", Boolean)
], ShippingRateDto.prototype, "isFastest", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indicates if this is the most economical option',
        example: true,
        required: false,
    }),
    __metadata("design:type", Boolean)
], ShippingRateDto.prototype, "isCheapest", void 0);
class ShippingRatesResponseDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { rates: { required: true, type: () => [require("./shipping-rate-response.dto").ShippingRateDto] }, originPostalCode: { required: true, type: () => String }, destinationPostalCode: { required: true, type: () => String } };
    }
}
exports.ShippingRatesResponseDto = ShippingRatesResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of available shipping rates',
        type: [ShippingRateDto],
    }),
    __metadata("design:type", Array)
], ShippingRatesResponseDto.prototype, "rates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Origin postal code',
        example: 'M5V3L9',
    }),
    __metadata("design:type", String)
], ShippingRatesResponseDto.prototype, "originPostalCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Destination postal code',
        example: 'V6B2W9',
    }),
    __metadata("design:type", String)
], ShippingRatesResponseDto.prototype, "destinationPostalCode", void 0);
//# sourceMappingURL=shipping-rate-response.dto.js.map