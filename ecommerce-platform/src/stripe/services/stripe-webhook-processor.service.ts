import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ProcessedWebhookEvent } from '../entities/processed-webhook-event.entity';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { STRIPE_CONFIG } from '../stripe.constants';
import type { StripeConfig } from '../config/stripe.config';

type WebhookEvent = Stripe.Event & { id: string; type: string };

@Injectable()
export class StripeWebhookProcessorService implements OnModuleInit {
  private readonly logger = new Logger(StripeWebhookProcessorService.name);
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 1000; // 1 second

  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(ProcessedWebhookEvent)
    private readonly processedWebhookRepository: Repository<ProcessedWebhookEvent>,
    private readonly configService: ConfigService,
    @Inject(STRIPE_CONFIG) private readonly stripeConfig: StripeConfig,
  ) {
    this.stripe = new Stripe(this.stripeConfig.secretKey, {
      apiVersion: this.stripeConfig.apiVersion as any,
    });
  }

  async onModuleInit() {
    await this.cleanupOldEvents();
  }

  async processWebhookEvent(
    event: WebhookEvent,
    signature: string,
    requestBody: Buffer,
  ): Promise<{ processed: boolean; message: string }> {
    // Check if we've already processed this event
    const where: FindOptionsWhere<ProcessedWebhookEvent> = { id: event.id };
    const existingEvent = await this.processedWebhookRepository.findOne({ where });

    if (existingEvent) {
      this.logger.log(`Event ${event.id} already processed, skipping`);
      return { processed: true, message: 'Event already processed' };
    }

    // Verify the webhook signature
    const webhookSecret = this.stripeConfig.webhookSecret;
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret is not configured');
    }

    const isVerified = await this.verifyWebhookSignature(
      requestBody,
      signature,
      webhookSecret,
    );

    if (!isVerified) {
      throw new Error('Invalid webhook signature');
    }

    // Process the event with retry logic
    return this.processWithRetry(event);
  }

  private async processWithRetry(
    event: WebhookEvent,
    attempt = 1,
  ): Promise<{ processed: boolean; message: string }> {
    try {
      // Process the event based on its type
      await this.handleEvent(event);

      // Mark the event as processed
      await this.markEventAsProcessed(event);

      return { processed: true, message: 'Event processed successfully' };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logger.error(
        `Error processing event ${event.id} (attempt ${attempt}): ${errorMessage}`,
        errorStack,
      );

      if (attempt >= this.MAX_RETRY_ATTEMPTS) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        await this.markEventAsFailed(event, normalizedError);
        throw normalizedError;
      }

      // Wait before retrying
      await new Promise((resolve) =>
        setTimeout(resolve, this.RETRY_DELAY_MS * attempt),
      );

      return this.processWithRetry(event, attempt + 1);
    }
  }

  private async handleEvent(event: WebhookEvent): Promise<void> {
    this.logger.log(`Processing event: ${event.type} (${event.id})`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event);
        break;
      case 'charge.refunded':
        await this.handleChargeRefunded(event);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutSessionCompleted(
    event: Stripe.Event,
  ): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    this.logger.log(`Checkout session completed: ${session.id}`);
    // Implement your checkout session completed logic here
  }

  private async handlePaymentIntentSucceeded(
    event: Stripe.Event,
  ): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    this.logger.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
    // Implement your payment intent succeeded logic here
  }

  private async handlePaymentIntentFailed(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    this.logger.warn(`PaymentIntent failed: ${paymentIntent.id}`);
    // Implement your payment intent failed logic here
  }

  private async handleChargeRefunded(event: Stripe.Event): Promise<void> {
    const charge = event.data.object as Stripe.Charge;
    this.logger.log(`Charge refunded: ${charge.id}`);
    // Implement your charge refunded logic here
  }

  private async verifyWebhookSignature(
    payload: Buffer,
    signature: string,
    secret: string,
  ): Promise<boolean> {
    try {
      const stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
        apiVersion: '2023-10-16',
      });

      // This will throw an error if the signature is invalid
      const event = stripe.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      return false;
    }
  }

  private async markEventAsProcessed(event: WebhookEvent): Promise<void> {
    const processedEvent = new ProcessedWebhookEvent({
      id: event.id,
      type: event.type,
      data: event.data,
      processed: true,
      status: 'processed',
      processedAt: new Date(),
      metadata: {
        eventType: event.type,
        apiVersion: event.api_version,
        created: new Date(event.created * 1000).toISOString(),
      },
    });
    
    await this.processedWebhookRepository.save(processedEvent);
  }

  private async markEventAsFailed(
    event: WebhookEvent,
    error: Error,
  ): Promise<void> {
    const failedEvent = new ProcessedWebhookEvent({
      id: event.id,
      type: event.type,
      data: event.data,
      processed: false,
      status: 'failed',
      processedAt: new Date(),
      error: JSON.stringify({
        name: error.name,
        message: error.message,
        stack: error.stack,
      }),
      metadata: {
        eventType: event.type,
        apiVersion: event.api_version,
        created: new Date(event.created * 1000).toISOString(),
        retryCount: 1, // This will be updated by the retry logic
      },
    });
    
    await this.processedWebhookRepository.save(failedEvent);
  }

  private async cleanupOldEvents(): Promise<void> {
    // Keep successful events for 90 days, failed events for 30 days
    const successCutoff = new Date();
    successCutoff.setDate(successCutoff.getDate() - 90);
    
    const failedCutoff = new Date();
    failedCutoff.setDate(failedCutoff.getDate() - 30);

    // Delete successful events older than 90 days
    await this.processedWebhookRepository
      .createQueryBuilder()
      .delete()
      .from(ProcessedWebhookEvent)
      .where('status = :status AND processedAt < :cutoff', {
        status: 'processed',
        cutoff: successCutoff
      })
      .execute();

    // Delete failed events older than 30 days
    await this.processedWebhookRepository
      .createQueryBuilder()
      .delete()
      .from(ProcessedWebhookEvent)
      .where('status = :status AND processedAt < :cutoff', {
        status: 'failed',
        cutoff: failedCutoff
      })
      .execute();

    this.logger.log('Cleaned up old webhook events');
  }
}
