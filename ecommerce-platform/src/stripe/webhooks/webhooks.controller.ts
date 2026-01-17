import { 
  Controller, 
  Post, 
  Req, 
  Res, 
  UseInterceptors, 
  UseFilters, 
  UseGuards, 
  HttpStatus,
  RawBodyRequest,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { StripeWebhookProcessorService } from '../services/stripe-webhook-processor.service';
import { StripeWebhookRateLimitInterceptor } from '../interceptors/stripe-webhook-rate-limit.interceptor';
import { StripeExceptionFilter } from '../filters/stripe-exception.filter';
import { StripeWebhookIpWhitelistMiddleware } from '../middleware/stripe-webhook-ip-whitelist.middleware';

@ApiTags('stripe-webhooks')
@Controller('webhooks/stripe')
@UseFilters(StripeExceptionFilter)
@UseInterceptors(StripeWebhookRateLimitInterceptor)
@UseGuards(StripeWebhookIpWhitelistMiddleware)
export class StripeWebhookController {
  constructor(
    private readonly webhookService: StripeWebhookProcessorService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ): Promise<Response> {
    const sig = req.headers['stripe-signature'] as string;
    const payload = req.rawBody;

    if (!sig || !payload) {
      return res.status(HttpStatus.BAD_REQUEST).json({ 
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Missing Stripe signature or payload',
        error: 'Bad Request',
      });
    }

    try {
      // Parse the event from the payload
      const event = JSON.parse(payload.toString()) as Record<string, unknown>;
      
      // Process the webhook event
      const result = await this.webhookService.processWebhookEvent(
        event as any, // Type assertion needed due to Stripe's complex types
        sig,
        Buffer.isBuffer(payload) ? payload : Buffer.from(payload),
      );
      
      return res.status(HttpStatus.OK).json(result);
    } catch (error: unknown) {
      // The error will be handled by the StripeExceptionFilter
      throw error;
    }
  }
}
