"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shipment = exports.ShipmentStatus = void 0;
const objection_1 = require("objection");
const uuid_1 = require("uuid");
var ShipmentStatus;
(function (ShipmentStatus) {
    ShipmentStatus["CREATED"] = "created";
    ShipmentStatus["PROCESSING"] = "processing";
    ShipmentStatus["SHIPPED"] = "shipped";
    ShipmentStatus["IN_TRANSIT"] = "in_transit";
    ShipmentStatus["OUT_FOR_DELIVERY"] = "out_for_delivery";
    ShipmentStatus["DELIVERED"] = "delivered";
    ShipmentStatus["FAILED"] = "failed";
    ShipmentStatus["CANCELLED"] = "cancelled";
})(ShipmentStatus || (exports.ShipmentStatus = ShipmentStatus = {}));
class Shipment extends objection_1.Model {
    constructor() {
        super(...arguments);
        this.carrier = 'CANADA_POST';
        this.insuranceCost = 0;
        this.status = ShipmentStatus.CREATED;
    }
    $beforeInsert() {
        this.id = this.id || (0, uuid_1.v4)();
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
    $beforeUpdate() {
        this.updatedAt = new Date();
    }
    static get jsonSchema() {
        return {
            type: 'object',
            required: [
                'orderId',
                'serviceName',
                'trackingNumber',
                'shippingCost',
                'totalCost',
                'dimensions',
                'originAddress',
                'destinationAddress',
            ],
            properties: {
                id: { type: 'string', format: 'uuid' },
                orderId: { type: 'string', format: 'uuid' },
                carrier: { type: 'string', default: 'CANADA_POST' },
                serviceName: { type: 'string' },
                trackingNumber: { type: 'string' },
                trackingUrl: { type: ['string', 'null'] },
                labelUrl: { type: ['string', 'null'] },
                shippingCost: { type: 'number', minimum: 0 },
                insuranceCost: { type: 'number', minimum: 0, default: 0 },
                totalCost: { type: 'number', minimum: 0 },
                status: {
                    type: 'string',
                    enum: Object.values(ShipmentStatus),
                    default: ShipmentStatus.CREATED
                },
                shippedAt: { type: ['string', 'null'], format: 'date-time' },
                deliveredAt: { type: ['string', 'null'], format: 'date-time' },
                dimensions: {
                    type: 'object',
                    required: ['length', 'width', 'height', 'weight', 'unit'],
                    properties: {
                        length: { type: 'number', minimum: 0.1 },
                        width: { type: 'number', minimum: 0.1 },
                        height: { type: 'number', minimum: 0.1 },
                        weight: { type: 'number', minimum: 0.01 },
                        unit: {
                            type: 'string',
                            enum: ['cm', 'in', 'kg', 'lb'],
                            default: 'cm'
                        },
                    },
                },
                originAddress: { type: 'object' },
                destinationAddress: { type: 'object' },
            },
        };
    }
    static get relationMappings() {
        const { Order } = require('./Order');
        return {
            order: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: Order,
                join: {
                    from: 'shipments.order_id',
                    to: 'orders.id',
                },
            },
        };
    }
}
exports.Shipment = Shipment;
Shipment.tableName = 'shipments';
