import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { IsDate, IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELED = 'canceled',
}

export enum PaymentMethodType {
  CARD = 'card',
  IDEAL = 'ideal',
  SEPA_DEBIT = 'sepa_debit',
  SOFORT = 'sofort',
  BANCONTACT = 'bancontact',
  GIROPAY = 'giropay',
  P24 = 'p24',
  EPS = 'eps',
  MULTIBANCO = 'multibanco',
  WECHAT_PAY = 'wechat_pay',
  AFTERPAY_CLEARPAY = 'afterpay_clearpay',
  BOLETO = 'boleto',
  OXXO = 'oxxo',
  KLARNA = 'klarna',
  AFFIRM = 'affirm',
  PAYPAL = 'paypal',
  AMAZON_PAY = 'amazon_pay',
  LINK = 'link',
  GRABPAY = 'grabpay',
  FPX = 'fpx',
  ALIPAY = 'alipay',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'The unique identifier of the payment' })
  id: string;

  @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  @ApiProperty({ type: () => Order })
  order: Order;

  @Column({ type: 'uuid' })
  @ApiProperty({ description: 'The ID of the associated order' })
  orderId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  @ApiProperty({ type: () => User })
  user: User;

  @Column({ type: 'uuid' })
  @ApiProperty({ description: 'The ID of the user who made the payment' })
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @ApiProperty({ description: 'The payment amount' })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'CAD' })
  @IsString()
  @ApiProperty({ description: 'The currency code (e.g., CAD, USD)' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  @IsEnum(PaymentStatus)
  @ApiProperty({ enum: PaymentStatus, description: 'The current status of the payment' })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethodType, default: PaymentMethodType.CARD })
  @IsEnum(PaymentMethodType)
  @ApiProperty({ enum: PaymentMethodType, description: 'The payment method used' })
  paymentMethodType: PaymentMethodType;

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ description: 'Additional payment method details', required: false })
  paymentMethodDetails: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Stripe Payment Intent ID', required: false })
  stripePaymentIntentId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Stripe Charge ID', required: false })
  stripeChargeId: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Receipt URL for the payment', required: false })
  receiptUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ description: 'Additional metadata for the payment', required: false })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  @ApiProperty({ description: 'When the payment was successfully completed', required: false })
  paidAt: Date | null = null;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  @ApiProperty({ description: 'When the payment failed', required: false })
  failedAt: Date | null = null;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Error message if the payment failed', required: false })
  error: string | null = null;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  @ApiProperty({ description: 'When the payment was canceled', required: false })
  canceledAt: Date | null = null;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  @ApiProperty({ description: 'When the payment was refunded', required: false })
  refundedAt: Date | null = null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: 'Amount that was refunded', required: false })
  refundAmount: number | null = null;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  @ApiProperty({ description: 'When the payment was processed', required: false })
  processedAt: Date | null = null;

  @CreateDateColumn()
  @ApiProperty({ description: 'When the payment record was created' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'When the payment record was last updated' })
  updatedAt: Date;

  // Helper methods
  markAsSucceeded(data: {
    paymentIntentId: string;
    chargeId?: string;
    receiptUrl?: string;
    paymentMethod?: any;
  }) {
    this.status = PaymentStatus.SUCCEEDED;
    this.stripePaymentIntentId = data.paymentIntentId;
    this.stripeChargeId = data.chargeId;
    this.receiptUrl = data.receiptUrl;
    this.paidAt = new Date();
    
    if (data.paymentMethod) {
      this.paymentMethodDetails = data.paymentMethod;
    }
  }

  markAsFailed(error?: any) {
    this.status = PaymentStatus.FAILED;
    if (error) {
      this.metadata = {
        ...(this.metadata || {}),
        error: {
          message: error.message,
          code: error.code,
          ...error,
        },
      };
    }
  }
}
