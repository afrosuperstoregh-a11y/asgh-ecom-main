import { Request, Response } from 'express';
import { db } from '../config/database';
import { ApiResponseUtil } from '../utils/response';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { PaymentStatus, OrderStatus } from '../types/enums';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export class PaymentController {
  // POST /api/payments/intent - Create payment intent
  static createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.body;

    if (!orderId) {
      throw ApiError.badRequest('Order ID is required');
    }

    // Get order details
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Check if order already has a payment
    const existingPayment = await db.payment.findFirst({
      where: {
        orderId,
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING, PaymentStatus.COMPLETED]
        }
      }
    });

    if (existingPayment) {
      throw ApiError.badRequest('Payment already exists for this order');
    }

    // Create Stripe payment intent
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(order.total) * 100), // Convert to cents
        currency: order.currency.toLowerCase(),
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create payment record in database
      const payment = await db.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          currency: order.currency,
          status: PaymentStatus.PENDING,
          provider: 'stripe',
          providerId: paymentIntent.id,
          metadata: {
            clientSecret: paymentIntent.client_secret
          }
        }
      });

      // Update order with payment ID
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentId: payment.id,
          paymentStatus: PaymentStatus.PENDING
        }
      });

      return ApiResponseUtil.success(res, {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: order.total,
        currency: order.currency
      }, 'Payment intent created successfully');

    } catch (stripeError: any) {
      throw ApiError.internal(`Stripe error: ${stripeError.message}`);
    }
  });

  // POST /api/payments/confirm - Confirm payment (webhook handler)
  static confirmPayment = asyncHandler(async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      throw ApiError.badRequest('Invalid webhook signature');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      throw ApiError.badRequest(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await PaymentController.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await PaymentController.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.canceled':
        await PaymentController.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return ApiResponseUtil.success(res, { received: true });
  });

  // Helper method to handle successful payment
  private static async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error('Payment intent missing order ID');
      return;
    }

    try {
      // Update payment record
      await db.payment.updateMany({
        where: {
          providerId: paymentIntent.id,
          orderId
        },
        data: {
          status: PaymentStatus.COMPLETED,
          metadata: {
            ...paymentIntent,
            confirmedAt: new Date().toISOString()
          } as any
        }
      });

      // Update order
      await db.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.COMPLETED
        }
      });

      console.log(`Payment succeeded for order ${orderId}`);
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  // Helper method to handle failed payment
  private static async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error('Payment intent missing order ID');
      return;
    }

    try {
      // Update payment record
      await db.payment.updateMany({
        where: {
          providerId: paymentIntent.id,
          orderId
        },
        data: {
          status: PaymentStatus.FAILED,
          failureCode: paymentIntent.last_payment_error?.code || 'unknown',
          failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
          metadata: {
            ...paymentIntent,
            failedAt: new Date().toISOString()
          } as any
        }
      });

      // Update order
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.FAILED
        }
      });

      console.log(`Payment failed for order ${orderId}`);
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  // Helper method to handle canceled payment
  private static async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error('Payment intent missing order ID');
      return;
    }

    try {
      // Update payment record
      await db.payment.updateMany({
        where: {
          providerId: paymentIntent.id,
          orderId
        },
        data: {
          status: PaymentStatus.CANCELLED,
          metadata: {
            ...paymentIntent,
            canceledAt: new Date().toISOString()
          } as any
        }
      });

      // Update order
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.CANCELLED
        }
      });

      console.log(`Payment canceled for order ${orderId}`);
    } catch (error) {
      console.error('Error handling payment cancellation:', error);
    }
  }

  // GET /api/payments/:orderId - Get payment status for an order
  static getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const payment = await db.payment.findFirst({
      where: { orderId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true
          }
        }
      }
    });

    if (!payment) {
      throw ApiError.notFound('Payment not found');
    }

    return ApiResponseUtil.success(res, {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      createdAt: payment.createdAt,
      order: payment.order
    });
  });

  // POST /api/payments/refund - Create refund
  static createRefund = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, reason } = req.body;

    if (!orderId) {
      throw ApiError.badRequest('Order ID is required');
    }

    // Get payment record
    const payment = await db.payment.findFirst({
      where: {
        orderId,
        status: PaymentStatus.COMPLETED
      }
    });

    if (!payment) {
      throw ApiError.notFound('No completed payment found for this order');
    }

    // Check if refund already exists
    const existingRefund = await db.refund.findFirst({
      where: { paymentId: payment.id }
    });

    if (existingRefund) {
      throw ApiError.badRequest('Refund already processed for this payment');
    }

    try {
      // Create Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: payment.providerId,
        reason: 'requested_by_customer',
        metadata: {
          orderId,
          paymentId: payment.id
        }
      });

      // Create refund record
      const refundRecord = await db.refund.create({
        data: {
          paymentId: payment.id,
          amount: payment.amount,
          reason: reason || 'Customer requested refund',
          status: refund.status === 'succeeded' ? 'COMPLETED' : 'PENDING',
          providerId: refund.id,
          metadata: refund as any
        }
      });

      // Update payment status
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUNDED
        }
      });

      // Update order status
      await db.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.REFUNDED,
          paymentStatus: PaymentStatus.REFUNDED
        }
      });

      return ApiResponseUtil.success(res, refundRecord, 'Refund processed successfully');

    } catch (stripeError: any) {
      throw ApiError.internal(`Stripe refund error: ${stripeError.message}`);
    }
  });
}
