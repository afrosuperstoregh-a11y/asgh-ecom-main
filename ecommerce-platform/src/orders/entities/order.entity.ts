import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { User } from '../../users/entities/user.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  shipping: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'varchar', length: 3, default: 'CAD' })
  currency: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'jsonb', nullable: true })
  shippingAddress: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  billingAddress: Record<string, any>;

  @Column({ nullable: true })
  customerNotes: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];

  @Column({ nullable: true })
  stripeCheckoutSessionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  calculateTotals() {
    this.subtotal = this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    // For now, using a simple tax calculation
    this.tax = parseFloat((this.subtotal * 0.13).toFixed(2)); // 13% tax
    this.shipping = this.subtotal > 0 ? 10 : 0; // $10 flat rate shipping
    this.total = parseFloat(
      (this.subtotal + this.tax + this.shipping).toFixed(2),
    );
  }

  markAsPaid() {
    this.status = OrderStatus.PROCESSING;
    // Additional logic for order processing can be added here
  }
}
