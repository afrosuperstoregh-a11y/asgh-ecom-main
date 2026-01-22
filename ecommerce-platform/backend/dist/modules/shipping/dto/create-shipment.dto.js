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
exports.CreateShipmentDto = exports.PackageItemDto = exports.ShipmentPurpose = exports.PackageType = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const shared_dto_1 = require("./shared.dto");
var PackageType;
(function (PackageType) {
    PackageType["PARCEL"] = "parcel";
    PackageType["DOCUMENT"] = "document";
    PackageType["FREIGHT"] = "freight";
})(PackageType || (exports.PackageType = PackageType = {}));
var ShipmentPurpose;
(function (ShipmentPurpose) {
    ShipmentPurpose["GIFT"] = "GIFT";
    ShipmentPurpose["SOLD"] = "SOLD";
    ShipmentPurpose["RETURN"] = "RETURN";
    ShipmentPurpose["REPAIR"] = "REPAIR";
    ShipmentPurpose["PERSONAL"] = "PERSONAL";
    ShipmentPurpose["NOT_SOLD"] = "NOT_SOLD";
    ShipmentPurpose["OTHER"] = "OTHER";
})(ShipmentPurpose || (exports.ShipmentPurpose = ShipmentPurpose = {}));
class PackageItemDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { description: { required: true, type: () => String }, quantity: { required: true, type: () => Number }, weight: { required: true, type: () => Number }, dimensions: { required: true, type: () => require("./shared.dto").ShippingDimensionsDto }, value: { required: false, type: () => Number }, sku: { required: false, type: () => String }, hsCode: { required: false, type: () => String }, originCountry: { required: false, type: () => String } };
    }
}
exports.PackageItemDto = PackageItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PackageItemDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], PackageItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], PackageItemDto.prototype, "weight", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => shared_dto_1.ShippingDimensionsDto),
    __metadata("design:type", shared_dto_1.ShippingDimensionsDto)
], PackageItemDto.prototype, "dimensions", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PackageItemDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PackageItemDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PackageItemDto.prototype, "hsCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PackageItemDto.prototype, "originCountry", void 0);
class CreateShipmentDto {
    constructor() {
        this.packageType = PackageType.PARCEL;
        this.purpose = ShipmentPurpose.SOLD;
        this.requiresSignature = false;
        this.isInsured = false;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { orderId: { required: true, type: () => Number }, packageType: { required: false, default: PackageType.PARCEL, enum: require("./create-shipment.dto").PackageType }, purpose: { required: false, default: ShipmentPurpose.SOLD, enum: require("./create-shipment.dto").ShipmentPurpose }, sender: { required: true, type: () => require("./shared.dto").AddressDto }, recipient: { required: true, type: () => require("./shared.dto").AddressDto }, items: { required: true, type: () => [require("./create-shipment.dto").PackageItemDto], minItems: 1 }, serviceCode: { required: false, type: () => String }, requiresSignature: { required: false, type: () => Boolean, default: false }, isInsured: { required: false, type: () => Boolean, default: false }, insuredValue: { required: false, type: () => Number }, instructions: { required: false, type: () => String }, metadata: { required: false, type: () => Object } };
    }
}
exports.CreateShipmentDto = CreateShipmentDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateShipmentDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(PackageType),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "packageType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ShipmentPurpose),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "purpose", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => shared_dto_1.AddressDto),
    __metadata("design:type", shared_dto_1.AddressDto)
], CreateShipmentDto.prototype, "sender", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => shared_dto_1.AddressDto),
    __metadata("design:type", shared_dto_1.AddressDto)
], CreateShipmentDto.prototype, "recipient", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PackageItemDto),
    __metadata("design:type", Array)
], CreateShipmentDto.prototype, "items", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "serviceCode", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateShipmentDto.prototype, "requiresSignature", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateShipmentDto.prototype, "isInsured", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateShipmentDto.prototype, "insuredValue", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "instructions", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateShipmentDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-shipment.dto.js.map