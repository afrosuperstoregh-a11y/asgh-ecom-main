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
exports.ShippingRatesResponseDto = exports.ShippingRateDto = exports.ShippingRateRequestDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class AddressDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { country: { required: true, type: () => String }, postalCode: { required: true, type: () => String }, city: { required: true, type: () => String }, province: { required: true, type: () => String } };
    }
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddressDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddressDto.prototype, "postalCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddressDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddressDto.prototype, "province", void 0);
class ItemDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { weight: { required: true, type: () => Number }, length: { required: true, type: () => Number }, width: { required: true, type: () => Number }, height: { required: true, type: () => Number } };
    }
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], ItemDto.prototype, "weight", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], ItemDto.prototype, "length", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], ItemDto.prototype, "width", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], ItemDto.prototype, "height", void 0);
class ShippingRateRequestDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { origin: { required: true, type: () => AddressDto }, destination: { required: true, type: () => AddressDto }, items: { required: true, type: () => [ItemDto] } };
    }
}
exports.ShippingRateRequestDto = ShippingRateRequestDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AddressDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", AddressDto)
], ShippingRateRequestDto.prototype, "origin", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AddressDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", AddressDto)
], ShippingRateRequestDto.prototype, "destination", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ItemDto),
    __metadata("design:type", Array)
], ShippingRateRequestDto.prototype, "items", void 0);
class ShippingRateDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { serviceName: { required: true, type: () => String }, serviceCode: { required: true, type: () => String }, totalPrice: { required: true, type: () => Number }, currency: { required: true, type: () => String }, estimatedDeliveryDate: { required: false, type: () => String } };
    }
}
exports.ShippingRateDto = ShippingRateDto;
class ShippingRatesResponseDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { rates: { required: true, type: () => [require("./shipping-rate-request.dto").ShippingRateDto] } };
    }
}
exports.ShippingRatesResponseDto = ShippingRatesResponseDto;
//# sourceMappingURL=shipping-rate-request.dto.js.map