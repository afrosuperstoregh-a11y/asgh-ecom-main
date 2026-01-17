import { IsString, IsUUID, IsUrl, IsOptional, IsNotEmpty, IsArray, IsNumber, ValidateNested, IsBoolean, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethodType } from '../types/stripe.types';

class LineItemDto {
  @ApiProperty({
    description: 'Price data for the line item',
    example: {
      currency: 'usd',
      unit_amount: 1000,
      product_data: {
        name: 'Product Name',
        description: 'Product Description',
      },
    },
  })
  @IsObject()
  @IsNotEmpty()
  price_data!: {
    currency: string;
    unit_amount: number;
    product_data: {
      name: string;
      description?: string;
      metadata?: Record<string, string>;
    };
  };

  @ApiProperty({ description: 'Quantity of the item', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  constructor() {
    this.price_data = {
      currency: 'usd',
      unit_amount: 0,
      product_data: {
        name: '',
      },
    };
    this.quantity = 1;
  }
}

export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'The ID of the order to create a checkout session for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({
    description: 'The ID of the user creating the checkout session',
    example: 'user_123',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'The URL to redirect to after successful payment',
    example: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
    required: true,
  })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  successUrl!: string;

  @ApiProperty({
    description: 'The URL to redirect to if the user cancels',
    example: 'https://example.com/canceled',
    required: true,
  })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  cancelUrl!: string;

  @ApiPropertyOptional({
    description: 'Customer email for pre-filling the checkout form',
    example: 'customer@example.com',
  })
  @IsString()
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'List of payment method types to allow',
    example: ['card', 'ideal'],
    enum: Object.values(PaymentMethodType),
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  @IsEnum(PaymentMethodType, { each: true })
  paymentMethodTypes?: string[];

  @ApiPropertyOptional({
    description: 'Whether to collect shipping address',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  collectShippingAddress?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to allow promotion codes',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  allowPromotionCodes?: boolean;

  @ApiPropertyOptional({
    description: 'Line items for the checkout session',
    type: [LineItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  @IsOptional()
  lineItems?: LineItemDto[];

  @ApiPropertyOptional({
    description: 'Metadata to attach to the checkout session',
    example: { internal_reference: 'ABC123' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, string | number | null>;
}

export class CreateCheckoutSessionResponseDto {
  constructor(url: string, sessionId: string) {
    this.url = url;
    this.sessionId = sessionId;
  }

  @ApiProperty({
    description: 'The URL to redirect the user to complete the payment',
    example: 'https://checkout.stripe.com/pay/cs_test_...',
  })
  url!: string;

  @ApiProperty({
    description: 'The ID of the created checkout session',
    example: 'cs_test_...',
  })
  sessionId!: string;
}

export class WebhookResponseDto {
  constructor(received: boolean, message?: string) {
    this.received = received;
    this.message = message;
  }

  @ApiProperty({
    description: 'Indicates if the webhook was processed successfully',
    example: true,
  })
  received!: boolean;

  @ApiPropertyOptional({
    description: 'Additional message about the webhook processing',
    example: 'Webhook processed successfully',
  })
  message?: string;
}
