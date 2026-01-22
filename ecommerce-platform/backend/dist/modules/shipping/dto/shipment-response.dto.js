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
exports.ShipmentStatusResponseDto = exports.TrackShipmentResponseDto = exports.CreateShipmentResponseDto = exports.ShipmentResponseDto = exports.TrackingEventDto = exports.AddressResponseDto = exports.PackageItemResponseDto = exports.ShipmentStatus = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const shipment_entity_1 = require("../../../common/entities/shipment.entity");
var shipment_entity_2 = require("../../../common/entities/shipment.entity");
Object.defineProperty(exports, "ShipmentStatus", { enumerable: true, get: function () { return shipment_entity_2.ShipmentStatus; } });
class PackageItemResponseDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { description: { required: true, type: () => String }, quantity: { required: true, type: () => Number }, weight: { required: true, type: () => Number }, length: { required: true, type: () => Number }, width: { required: true, type: () => Number }, height: { required: true, type: () => Number }, value: { required: false, type: () => Number }, sku: { required: false, type: () => String } };
    }
}
exports.PackageItemResponseDto = PackageItemResponseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PackageItemResponseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PackageItemResponseDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PackageItemResponseDto.prototype, "weight", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PackageItemResponseDto.prototype, "length", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PackageItemResponseDto.prototype, "width", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PackageItemResponseDto.prototype, "height", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PackageItemResponseDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PackageItemResponseDto.prototype, "sku", void 0);
class AddressResponseDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, company: { required: false, type: () => String }, address1: { required: true, type: () => String }, address2: { required: false, type: () => String }, city: { required: true, type: () => String }, province: { required: true, type: () => String }, postalCode: { required: true, type: () => String }, country: { required: true, type: () => String }, phone: { required: false, type: () => String }, email: { required: false, type: () => String } };
    }
}
exports.AddressResponseDto = AddressResponseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "company", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "address1", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "address2", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "province", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "postalCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "email", void 0);
class TrackingEventDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => String }, description: { required: true, type: () => String }, timestamp: { required: true, type: () => String }, location: { required: false, type: () => String }, details: { required: false, type: () => Object } };
    }
}
exports.TrackingEventDto = TrackingEventDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackingEventDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackingEventDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], TrackingEventDto.prototype, "timestamp", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackingEventDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TrackingEventDto.prototype, "details", void 0);
class ShipmentResponseDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, orderId: { required: true, type: () => String }, carrier: { required: true, type: () => String }, serviceName: { required: true, type: () => String }, trackingNumber: { required: true, type: () => String }, trackingUrl: { required: false, type: () => String }, labelUrl: { required: false, type: () => String }, returnLabelUrl: { required: false, type: () => String }, cost: { required: true, type: () => Number }, status: { required: true, enum: require("../../../common/entities/shipment.entity").ShipmentStatus }, statusDescription: { required: false, type: () => String }, serviceCode: { required: false, type: () => String }, estimatedDeliveryDate: { required: false, type: () => String }, sender: { required: true, type: () => require("./shipment-response.dto").AddressResponseDto }, recipient: { required: true, type: () => require("./shipment-response.dto").AddressResponseDto }, items: { required: true, type: () => [require("./shipment-response.dto").PackageItemResponseDto] }, trackingEvents: { required: false, type: () => [require("./shipment-response.dto").TrackingEventDto] }, createdAt: { required: true, type: () => String }, updatedAt: { required: true, type: () => String }, metadata: { required: false, type: () => Object } };
    }
}
exports.ShipmentResponseDto = ShipmentResponseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShipmentResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShipmentResponseDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShipmentResponseDto.prototype, "carrier", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShipmentResponseDto.prototype, "serviceName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShipmentResponseDto.prototype, "trackingNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ShipmentResponseDto.prototype, "trackingUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ShipmentResponseDto.prototype, "labelUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ShipmentResponseDto.prototype, "returnLabelUrl", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ShipmentResponseDto.prototype, "cost", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(shipment_entity_1.ShipmentStatus),
    __metadata("design:type", String)
], ShipmentResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ShipmentResponseDto.prototype, "statusDescription", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ShipmentResponseDto.prototype, "serviceCode", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ShipmentResponseDto.prototype, "estimatedDeliveryDate", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AddressResponseDto),
    __metadata("design:type", AddressResponseDto)
], ShipmentResponseDto.prototype, "sender", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AddressResponseDto),
    __metadata("design:type", AddressResponseDto)
], ShipmentResponseDto.prototype, "recipient", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PackageItemResponseDto),
    __metadata("design:type", Array)
], ShipmentResponseDto.prototype, "items", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TrackingEventDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ShipmentResponseDto.prototype, "trackingEvents", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ShipmentResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ShipmentResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ShipmentResponseDto.prototype, "metadata", void 0);
class CreateShipmentResponseDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { shipment: { required: true, type: () => require("./shipment-response.dto").ShipmentResponseDto }, message: { required: false, type: () => String } };
    }
}
exports.CreateShipmentResponseDto = CreateShipmentResponseDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ShipmentResponseDto),
    __metadata("design:type", ShipmentResponseDto)
], CreateShipmentResponseDto.prototype, "shipment", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateShipmentResponseDto.prototype, "message", void 0);
class TrackShipmentResponseDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { trackingNumber: { required: true, type: () => String }, carrier: { required: true, type: () => String }, status: { required: true, enum: require("../../../common/entities/shipment.entity").ShipmentStatus }, statusDescription: { required: true, type: () => String }, estimatedDeliveryDate: { required: false, type: () => String }, actualDeliveryDate: { required: false, type: () => String }, events: { required: true, type: () => [require("./shipment-response.dto").TrackingEventDto] }, details: { required: false, type: () => Object } };
    }
}
exports.TrackShipmentResponseDto = TrackShipmentResponseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackShipmentResponseDto.prototype, "trackingNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackShipmentResponseDto.prototype, "carrier", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(shipment_entity_1.ShipmentStatus),
    __metadata("design:type", String)
], TrackShipmentResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackShipmentResponseDto.prototype, "statusDescription", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackShipmentResponseDto.prototype, "estimatedDeliveryDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrackShipmentResponseDto.prototype, "actualDeliveryDate", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TrackingEventDto),
    __metadata("design:type", Array)
], TrackShipmentResponseDto.prototype, "events", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TrackShipmentResponseDto.prototype, "details", void 0);
class ShipmentStatusResponseDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { trackingNumber: { required: true, type: () => String }, carrier: { required: true, type: () => String }, status: { required: true, enum: require("../../../common/entities/shipment.entity").ShipmentStatus }, statusDescription: { required: true, type: () => String }, estimatedDeliveryDate: { required: false, type: () => String }, lastUpdated: { required: false, type: () => String } };
    }
}
exports.ShipmentStatusResponseDto = ShipmentStatusResponseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShipmentStatusResponseDto.prototype, "trackingNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShipmentStatusResponseDto.prototype, "carrier", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(shipment_entity_1.ShipmentStatus),
    __metadata("design:type", String)
], ShipmentStatusResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShipmentStatusResponseDto.prototype, "statusDescription", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ShipmentStatusResponseDto.prototype, "estimatedDeliveryDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ShipmentStatusResponseDto.prototype, "lastUpdated", void 0);
//# sourceMappingURL=shipment-response.dto.js.map