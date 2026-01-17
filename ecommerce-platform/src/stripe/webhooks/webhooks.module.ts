import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeWebhookController } from './webhooks.controller';
import { StripeWebhookProcessorService } from '../services/stripe-webhook-processor.service';
import { StripeWebhookRateLimitInterceptor } from '../interceptors/stripe-webhook-rate-limit.interceptor';
import { StripeExceptionFilter } from '../filters/stripe-exception.filter';
import { StripeWebhookIpWhitelistMiddleware } from '../middleware/stripe-webhook-ip-whitelist.middleware';
import { ProcessedWebhookEvent } from '../entities/processed-webhook-event.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ProcessedWebhookEvent]),
  ],
  controllers: [StripeWebhookController],
  providers: [
    StripeWebhookProcessorService,
    {
      provide: StripeWebhookRateLimitInterceptor,
      useClass: StripeWebhookRateLimitInterceptor,
    },
    {
      provide: StripeExceptionFilter,
      useClass: StripeExceptionFilter,
    },
    {
      provide: StripeWebhookIpWhitelistMiddleware,
      useClass: StripeWebhookIpWhitelistMiddleware,
    },
  ],
  exports: [
    StripeWebhookProcessorService,
    StripeWebhookRateLimitInterceptor,
    StripeExceptionFilter,
  ],
})
export class WebhooksModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(StripeWebhookIpWhitelistMiddleware)
      .forRoutes(StripeWebhookController);
  }
}
