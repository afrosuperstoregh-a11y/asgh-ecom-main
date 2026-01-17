import { Module, Global, Logger, OnModuleInit, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../payments/entities/payment.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import stripeConfig, { StripeConfig, validateStripeConfig } from './config/stripe.config';
import { ProcessedWebhookEvent } from './entities/processed-webhook-event.entity';
import { STRIPE_CONFIG } from './stripe.constants';
import { WebhooksModule } from './webhooks/webhooks.module';
import { StripeWebhookIpWhitelistMiddleware } from './middleware/stripe-webhook-ip-whitelist.middleware';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(stripeConfig),
    TypeOrmModule.forFeature([
      Order, 
      Payment, 
      OrderItem,
      ProcessedWebhookEvent
    ]),
    WebhooksModule,
  ],
  controllers: [StripeController],
  providers: [
    StripeService,
    {
      provide: STRIPE_CONFIG,
      useFactory: (configService: ConfigService): StripeConfig => {
        // Get required configuration values
        const secretKey = configService.get<string>('stripe.secretKey');
        const webhookSecret = configService.get<string>('stripe.webhookSecret');
        const successUrl = configService.get<string>('stripe.successUrl');
        const cancelUrl = configService.get<string>('stripe.cancelUrl');

        if (!secretKey || !webhookSecret || !successUrl || !cancelUrl) {
          throw new Error(
            'Missing required Stripe configuration. Please check your environment variables.'
          );
        }

        const config: StripeConfig = {
          isLive: configService.get<string>('NODE_ENV') === 'production',
          secretKey,
          webhookSecret,
          apiVersion: configService.get<string>('stripe.apiVersion', '2023-10-16'),
          currency: configService.get<string>('stripe.currency', 'usd'),
          paymentMethods: configService.get<string[]>('stripe.paymentMethods', ['card']),
          shippingCountries: configService.get<string[]>('stripe.shippingCountries', ['US', 'CA']),
          successUrl,
          cancelUrl,
          webhookConfig: {
            tolerance: configService.get<number>('stripe.webhookTolerance', 300), // 5 minutes
            enabledEvents: configService.get<string[]>(
              'stripe.webhookEvents',
              [
                'checkout.session.completed',
                'payment_intent.succeeded',
                'payment_intent.payment_failed',
                'charge.refunded',
                'charge.failed',
              ]
            ),
          },
        };
        
        // Validate the configuration
        validateStripeConfig(config);
        
        return config;
      },
      inject: [ConfigService],
    },
  ],
  exports: [StripeService, WebhooksModule],
})
export class StripeModule implements OnModuleInit {
  private readonly logger = new Logger(StripeModule.name);
  private stripeConfig: StripeConfig;

  constructor(private readonly configService: ConfigService) {
    this.stripeConfig = this.configService.get<StripeConfig>('stripe')!;
  }

  onModuleInit() {
    if (this.stripeConfig) {
      this.logger.log(`Stripe module initialized in ${this.stripeConfig.isLive ? 'LIVE' : 'TEST'} mode`);
      this.logger.log(`API Version: ${this.stripeConfig.apiVersion}`);
      this.logger.log(`Currency: ${this.stripeConfig.currency.toUpperCase()}`);
      this.logger.log(`Payment Methods: ${this.stripeConfig.paymentMethods.join(', ')}`);
      this.logger.log(`Shipping Countries: ${this.stripeConfig.shippingCountries.join(', ')}`);
    } else {
      this.logger.warn('Stripe configuration not found. Please check your environment variables.');
    }
  }
}
