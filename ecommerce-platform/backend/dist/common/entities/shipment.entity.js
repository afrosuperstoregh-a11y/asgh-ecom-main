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
exports.Shipment = exports.ShipmentStatus = void 0;
const typeorm_1 = require("typeorm");
var ShipmentStatus;
(function (ShipmentStatus) {
    ShipmentStatus["CREATED"] = "CREATED";
    ShipmentStatus["PROCESSING"] = "PROCESSING";
    ShipmentStatus["SHIPPED"] = "SHIPPED";
    ShipmentStatus["IN_TRANSIT"] = "IN_TRANSIT";
    ShipmentStatus["OUT_FOR_DELIVERY"] = "OUT_FOR_DELIVERY";
    ShipmentStatus["DELIVERED"] = "DELIVERED";
    ShipmentStatus["FAILED"] = "FAILED";
    ShipmentStatus["RETURNED"] = "RETURNED";
    ShipmentStatus["CANCELLED"] = "CANCELLED";
})(ShipmentStatus || (exports.ShipmentStatus = ShipmentStatus = {}));
let Shipment = class Shipment {
    updateStatus(newStatus) {
        this.status = newStatus;
    }
    isShipped() {
        return [
            ShipmentStatus.SHIPPED,
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.OUT_FOR_DELIVERY,
            ShipmentStatus.DELIVERED,
        ].includes(this.status);
    }
    isDelivered() {
        return this.status === ShipmentStatus.DELIVERED;
    }
};
exports.Shipment = Shipment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Shipment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Shipment.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'CANADA_POST' }),
    __metadata("design:type", String)
], Shipment.prototype, "carrier", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'service_name' }),
    __metadata("design:type", String)
], Shipment.prototype, "serviceName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tracking_number', unique: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Shipment.prototype, "trackingNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'label_url', nullable: true }),
    __metadata("design:type", String)
], Shipment.prototype, "labelUrl", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Shipment.prototype, "cost", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ShipmentStatus,
        default: ShipmentStatus.CREATED,
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Shipment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Shipment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Shipment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shipment_id', nullable: true }),
    __metadata("design:type", String)
], Shipment.prototype, "shipmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'return_shipment_id', nullable: true }),
    __metadata("design:type", String)
], Shipment.prototype, "returnShipmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'return_label_url', nullable: true }),
    __metadata("design:type", String)
], Shipment.prototype, "returnLabelUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Shipment.prototype, "metadata", void 0);
exports.Shipment = Shipment = __decorate([
    (0, typeorm_1.Entity)('shipments')
], Shipment);
//# sourceMappingURL=shipment.entity.js.map