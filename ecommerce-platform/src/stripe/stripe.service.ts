import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, QueryFailedError } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../payments/entities/payment.entity';
import { OrderStatus } from '../orders/entities/order.entity';
import { PaymentStatus } from '../payments/entities/payment.entity';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { STRIPE_CONFIG } from './stripe.constants';
import { StripeConfig } from './config/stripe.config';
import type {
  CheckoutSessionParams,
  WebhookEvent,
  CreateCheckoutSessionOptions,
} from './types/stripe.types';
import { CreateCheckoutSessionResponseDto } from './dto/create-checkout-session.dto';
import { ProcessedWebhookEvent } from './entities/processed-webhook-event.entity';
import {
  STRIPE_API_VERSION,
  STRIPE_EVENTS,
  STRIPE_PAYMENT_METHODS,
  STRIPE_SHIPPING_COUNTRIES,
} from './stripe.constants';

const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
  'charge.refunded',
  'charge.failed',
];

@Injectable()
export class StripeService implements OnModuleInit {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(
    private configService: ConfigService,
    @Inject(STRIPE_CONFIG) private readonly stripeConfig: StripeConfig,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(ProcessedWebhookEvent)
    private processedWebhookRepository: Repository<ProcessedWebhookEvent>,
  ) {
    if (!stripeConfig.secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }

    this.stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
    });

    this.webhookSecret = stripeConfig.webhookSecret || '';
  }

  onModuleInit() {
    this.logger.log('StripeService initialized');
  }

  /**
   * Create a Stripe Checkout Session
   */
  async createCheckoutSession(
    options: CreateCheckoutSessionOptions,
  ): Promise<CreateCheckoutSessionResponseDto> {
    const {
      orderId,
      userId,
      customerEmail,
      lineItems,
      successUrl,
      cancelUrl,
      metadata = {},
      shippingRates = [],
      allowPromotionCodes = false,
    } = options;

    try {
      const params: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: STRIPE_PAYMENT_METHODS as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
        line_items: lineItems as Stripe.Checkout.SessionCreateParams.LineItem[],
        mode: 'payment',
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        client_reference_id: orderId,
        metadata: {
          orderId,
          userId,
          ...metadata,
        },
        shipping_address_collection: {
          allowed_countries: STRIPE_SHIPPING_COUNTRIES as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
        },
        shipping_rates: shippingRates.length > 0 ? (shippingRates as string[]) : undefined,
        allow_promotion_codes: allowPromotionCodes,
      };

      if (customerEmail) {
        params.customer_email = customerEmail;
      }

      const session = await this.stripe.checkout.sessions.create(params);

      this.logger.log(`Created checkout session ${session.id} for order ${orderId}`);
return new CreateCheckoutSessionResponseDto(session.url || '', session.id);    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logger.error(
        `Failed to create checkout session for order ${orderId}: ${errorMessage}`,
        errorStack,
      );
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(payload: Buffer, signature: string): Promise<boolean> {
    if (!this.webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Webhook signature verification failed: ${errorMessage}`);
      throw new Error('Webhook signature verification failed');
    }

    // Check if we've already processed this event
    try {
      const isProcessed = await this.processedWebhookRepository.findOne({
        where: { id: event.id },
      });

      if (isProcessed) {
        this.logger.log(`Event ${event.id} already processed, skipping`);
        return true;
      }
    } catch (error) {
      this.logger.error(`Error checking for duplicate event: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Continue processing even if we can't check for duplicates
    }

    // Log the received event
    this.logger.log(`Processing webhook event: ${event.type} (${event.id})`);

    // Store the event to prevent duplicate processing
    const processedEvent = this.processedWebhookRepository.create({
      id: event.id,
      type: event.type,
      processed: false,
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    try {
      await this.processedWebhookRepository.save(processedEvent);

      // Process the event based on its type
      if (Object.values(STRIPE_EVENTS).includes(event.type as any)) {
        await this.handleWebhookEventByType(event as WebhookEvent);
      } else {
        this.logger.warn(`Unhandled event type: ${event.type}`);
      }

      // Mark as processed
      await this.processedWebhookRepository.update(
        { id: event.id },
        { processed: true, updatedAt: new Date() },
      );

      return true;
    } catch (error) {
      const errorMessage = `Error processing webhook event ${event.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logger.error(errorMessage);
      
      // Update the event with error details
      await this.processedWebhookRepository.update(
        { id: event.id },
        { 
          processed: false, 
          error: errorMessage,
          updatedAt: new Date() 
        },
      );
      
      throw new Error(errorMessage);
    }
  }

  private async handleWebhookEventByType(event: WebhookEvent): Promise<void> {
    try {
      switch (event.type) {
        case STRIPE_EVENTS.CHECKOUT_SESSION_COMPLETED:
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case STRIPE_EVENTS.PAYMENT_INTENT_SUCCEEDED:
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case STRIPE_EVENTS.PAYMENT_INTENT_FAILED:
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case STRIPE_EVENTS.PAYMENT_INTENT_CANCELED:
          await this.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
          break;
        case STRIPE_EVENTS.CHARGE_REFUNDED:
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;
        case STRIPE_EVENTS.CHARGE_FAILED:
          await this.handleChargeFailed(event.data.object as Stripe.Charge);
          break;
        default:
          this.logger.warn(`No handler for event type: ${event.type}`);
      }
    } catch (error) {
      const errorMessage = `Error in handleWebhookEventByType for ${event.type}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      throw new Error('Order ID not found in session metadata');
    }

    try {
      // The payment might not be complete yet, so we'll update the order status
      // and wait for the payment_intent.succeeded event to mark it as paid
      await this.orderRepository.update(orderId, {
        status: OrderStatus.PROCESSING,
        updatedAt: new Date(),
      });
      
      this.logger.log(`Updated order ${orderId} status to PROCESSING after checkout session completed`);
    } catch (error) {
      const errorMessage = `Error updating order ${orderId} after checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata?.orderId;
    const userId = paymentIntent.metadata?.userId;
    
    if (!orderId || !userId) {
      throw new Error('Order ID or User ID not found in payment intent metadata');
    }

    // Start a transaction to ensure data consistency
    const queryRunner = this.orderRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: ['payments'],
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Create or update payment record
      let payment = order.payments?.find(p => p.stripePaymentIntentId === paymentIntent.id);
      
      if (!payment) {
        payment = new Payment();
        payment.orderId = orderId;
        payment.userId = userId;
        payment.amount = paymentIntent.amount ? paymentIntent.amount / 100 : 0; // Convert from cents
        payment.currency = paymentIntent.currency.toUpperCase();
        payment.stripePaymentIntentId = paymentIntent.id;
        payment.paymentMethodType = paymentIntent.payment_method_types?.[0] || 'card';
        payment.status = PaymentStatus.SUCCEEDED;
        payment.processedAt = new Date();
      }
      
      // Update payment status and details
      payment.status = PaymentStatus.SUCCEEDED;
      payment.paidAt = new Date();
      
      // Get receipt URL from the first charge if available
      const charge = paymentIntent.charges?.data?.[0];
      if (charge) {
        payment.receiptUrl = charge.receipt_url || undefined;
        payment.stripeChargeId = charge.id;
      }
      
      // Save payment
      await queryRunner.manager.save(Payment, payment);
      
      // Update order status to PAID if not already
      if (order.status !== OrderStatus.PAID) {
        order.status = OrderStatus.PAID;
        order.updatedAt = new Date();
        await queryRunner.manager.save(Order, order);
      }
      
      await queryRunner.commitTransaction();
      this.logger.log(`Successfully processed payment ${payment.id} for order ${orderId}`);
      
      // TODO: Trigger order confirmation email, update inventory, etc.
      
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const errorMessage = `Error processing payment intent succeeded: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      await queryRunner.release();
    }
  }
  
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) {
      throw new Error('Order ID not found in payment intent metadata');
    }
    
    try {
      // Find and update the payment record
      const payment = await this.paymentRepository.findOne({
        where: { stripePaymentIntentId: paymentIntent.id }
      });
      
      if (payment) {
        payment.status = PaymentStatus.FAILED;
        payment.failedAt = new Date();
        payment.error = paymentIntent.last_payment_error?.message || 'Payment failed';
        await this.paymentRepository.save(payment);
        
        this.logger.warn(`Payment ${payment.id} failed for order ${orderId}: ${payment.error}`);
      } else {
        this.logger.warn(`Payment intent ${paymentIntent.id} failed but no matching payment record found`);
      }
    } catch (error) {
      const errorMessage = `Error handling failed payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
  
  private async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) {
      throw new Error('Order ID not found in payment intent metadata');
    }
    
    try {
      // Find and update the payment record
      const payment = await this.paymentRepository.findOne({
        where: { stripePaymentIntentId: paymentIntent.id }
      });
      
      if (payment) {
        payment.status = PaymentStatus.CANCELED;
        payment.canceledAt = new Date();
        payment.error = paymentIntent.cancellation_reason || 'Payment was canceled';
        await this.paymentRepository.save(payment);
        
        this.logger.log(`Payment ${payment.id} was canceled for order ${orderId}`);
      } else {
        this.logger.warn(`Payment intent ${paymentIntent.id} was canceled but no matching payment record found`);
      }
    } catch (error) {
      const errorMessage = `Error handling canceled payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
  
  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const paymentIntentId = charge.payment_intent as string;
    if (!paymentIntentId) {
      throw new Error('Payment intent ID not found in charge');
    }
    
    try {
      // Find the payment record
      const payment = await this.paymentRepository.findOne({
        where: { stripePaymentIntentId: paymentIntentId }
      });
      
      if (payment) {
        payment.status = PaymentStatus.REFUNDED;
        payment.refundedAt = new Date();
        payment.refundAmount = (payment.amount || 0) - (charge.amount_refunded ? charge.amount_refunded / 100 : 0);
        await this.paymentRepository.save(payment);
        
        // Update order status to REFUNDED
        await this.orderRepository.update(payment.orderId, {
          status: OrderStatus.REFUNDED,
          updatedAt: new Date(),
        });
        
        this.logger.log(`Payment ${payment.id} was refunded for order ${payment.orderId}`);
      } else {
        this.logger.warn(`Charge ${charge.id} was refunded but no matching payment record found`);
      }
    } catch (error) {
      const errorMessage = `Error handling refunded charge: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
  
  private async handleChargeFailed(charge: Stripe.Charge): Promise<void> {
    try {
      // Find the payment record
      const payment = await this.paymentRepository.findOne({
        where: { stripeChargeId: charge.id },
      });
      
      if (payment) {
        payment.status = PaymentStatus.FAILED;
        payment.failedAt = new Date();
        await this.paymentRepository.save(payment);
        
        this.logger.warn(`Charge ${charge.id} failed for payment ${payment.id}`);
      } else {
        this.logger.warn(`Charge ${charge.id} failed but no matching payment record found`);
      }
    } catch (error) {
      const errorMessage = `Error handling failed charge: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }


  /**
   * Refund a payment
   */
  async createRefund(payment: Payment, amount?: number) {
    if (!payment.stripeChargeId) {
      throw new Error('No charge ID available for refund');
    }

    const refund = await this.stripe.refunds.create({
      charge: payment.stripeChargeId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
      metadata: {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
      },
    });

    // Update payment status to refunded
    await this.paymentRepository.update(
      { id: payment.id },
      {
        status: PaymentStatus.REFUNDED,
        metadata: {
          ...(payment.metadata || {}),
          refundId: refund.id,
        },
      }
    );

    return refund;
  }

  /**
   * Get a payment intent by ID
   */
  async getPaymentIntent(paymentIntentId: string) {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }
}
