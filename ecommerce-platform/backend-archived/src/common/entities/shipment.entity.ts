import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ShipmentStatus {
  CREATED = 'CREATED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
  AVAILABLE_FOR_PICKUP = 'AVAILABLE_FOR_PICKUP',
  EXCEPTION = 'EXCEPTION',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN = 'UNKNOWN'
}

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  @Index()
  orderId: number;

  @Column({ default: 'CANADA_POST' })
  carrier: string;

  @Column({ name: 'service_name' })
  serviceName: string;

  @Column({ name: 'tracking_number', unique: true })
  @Index()
  trackingNumber: string;

  @Column({ name: 'label_url', nullable: true })
  labelUrl: string;

  @Column('decimal', { precision: 10, scale: 2 })
  cost: number;

  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.CREATED,
  })
  @Index()
  status: ShipmentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Additional fields for Canada Post specific data
  @Column({ name: 'shipment_id', nullable: true })
  shipmentId?: string;

  @Column({ name: 'return_shipment_id', nullable: true })
  returnShipmentId?: string;

  @Column({ name: 'return_label_url', nullable: true })
  returnLabelUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Add any additional methods or relationships here
  updateStatus(newStatus: ShipmentStatus): void {
    this.status = newStatus;
  }

  isShipped(): boolean {
    return [
      ShipmentStatus.SHIPPED,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.OUT_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
    ].includes(this.status);
  }

  isDelivered(): boolean {
    return this.status === ShipmentStatus.DELIVERED;
  }
}
