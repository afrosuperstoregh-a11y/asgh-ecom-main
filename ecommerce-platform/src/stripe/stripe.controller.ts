// stripe.controller.ts
import { Response as ExpressResponse } from 'express';
import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeService } from './stripe.service';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export class CreateCheckoutSessionDto {
  orderId: string;
  successUrl?: string;
  cancelUrl?: string;
}

@ApiTags('stripe')
@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {}

  @Post('create-checkout-session')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a checkout session' })
  @ApiResponse({ status: 201, description: 'Checkout session created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCheckoutSession(
    @CurrentUser() user: User,
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto,
    @Res() res: Response,
  ) {
    try {
      const { orderId, successUrl, cancelUrl } = createCheckoutSessionDto;
      
      const session = await this.stripeService.createCheckoutSession({
        orderId,
        userId: user.id,
        customerEmail: user.email,
        successUrl: successUrl || this.configService.get('STRIPE_SUCCESS_URL'),
        cancelUrl: cancelUrl || this.configService.get('STRIPE_CANCEL_URL'),
      });

      return res.status(HttpStatus.CREATED).json({
        url: session.url,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook handled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const sig = req.headers['stripe-signature'];
    const payload = req.body;

    if (!sig) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'No signature provided' });
    }

    try {
      await this.stripeService.handleWebhookEvent(payload, sig);
      return res.status(HttpStatus.OK).json({ received: true });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
    }
  }

  @Get('payment-intent/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment intent details' })
  @ApiResponse({ status: 200, description: 'Payment intent details' })
  @ApiResponse({ status: 404, description: 'Payment intent not found' })
  async getPaymentIntent(
    @Param('id') id: string,
  ) {
    try {
      return await this.stripeService.getPaymentIntent(id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}