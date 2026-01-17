import { Model } from 'objection';
import { v4 as uuidv4 } from 'uuid';

export interface ShipmentDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
  unit: 'cm' | 'in' | 'kg' | 'lb';
}

export interface ShipmentAddress {
  name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export enum ShipmentStatus {
  CREATED = 'created',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export class Shipment extends Model {
  static tableName = 'shipments';

  id!: string;
  orderId!: string;
  carrier: string = 'CANADA_POST';
  serviceName!: string;
  trackingNumber!: string;
  trackingUrl?: string;
  labelUrl?: string;
  shippingCost!: number;
  insuranceCost: number = 0;
  totalCost!: number;
  dimensions!: ShipmentDimensions;
  originAddress!: ShipmentAddress;
  destinationAddress!: ShipmentAddress;
  status: ShipmentStatus = ShipmentStatus.CREATED;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  $beforeInsert() {
    this.id = this.id || uuidv4();
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
        relation: Model.BelongsToOneRelation,
        modelClass: Order,
        join: {
          from: 'shipments.order_id',
          to: 'orders.id',
        },
      },
    };
  }
}

// Add this to your TypeScript declaration merging
declare module 'objection' {
  interface Model {
    $beforeInsert(): void | Promise<any>;
    $beforeUpdate(): void | Promise<any>;
  }
}
