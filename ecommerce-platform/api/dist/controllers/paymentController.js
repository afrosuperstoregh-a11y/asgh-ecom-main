"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const database_1 = require("../config/database");
const response_1 = require("../utils/response");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const enums_1 = require("../types/enums");
const stripe_1 = __importDefault(require("stripe"));
// Initialize Stripe
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});
class PaymentController {
    // Helper method to handle successful payment
    static async handlePaymentSucceeded(paymentIntent) {
        const orderId = paymentIntent.metadata.orderId;
        if (!orderId) {
            console.error('Payment intent missing order ID');
            return;
        }
        try {
            // Update payment record
            await database_1.db.payment.updateMany({
                where: {
                    providerId: paymentIntent.id,
                    orderId
                },
                data: {
                    status: enums_1.PaymentStatus.COMPLETED,
                    metadata: {
                        ...paymentIntent,
                        confirmedAt: new Date().toISOString()
                    }
                }
            });
            // Update order
            await database_1.db.order.update({
                where: { id: orderId },
                data: {
                    status: enums_1.OrderStatus.CONFIRMED,
                    paymentStatus: enums_1.PaymentStatus.COMPLETED
                }
            });
            console.log(`Payment succeeded for order ${orderId}`);
        }
        catch (error) {
            console.error('Error handling payment success:', error);
        }
    }
    // Helper method to handle failed payment
    static async handlePaymentFailed(paymentIntent) {
        const orderId = paymentIntent.metadata.orderId;
        if (!orderId) {
            console.error('Payment intent missing order ID');
            return;
        }
        try {
            // Update payment record
            await database_1.db.payment.updateMany({
                where: {
                    providerId: paymentIntent.id,
                    orderId
                },
                data: {
                    status: enums_1.PaymentStatus.FAILED,
                    failureCode: paymentIntent.last_payment_error?.code || 'unknown',
                    failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
                    metadata: {
                        ...paymentIntent,
                        failedAt: new Date().toISOString()
                    }
                }
            });
            // Update order
            await database_1.db.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: enums_1.PaymentStatus.FAILED
                }
            });
            console.log(`Payment failed for order ${orderId}`);
        }
        catch (error) {
            console.error('Error handling payment failure:', error);
        }
    }
    // Helper method to handle canceled payment
    static async handlePaymentCanceled(paymentIntent) {
        const orderId = paymentIntent.metadata.orderId;
        if (!orderId) {
            console.error('Payment intent missing order ID');
            return;
        }
        try {
            // Update payment record
            await database_1.db.payment.updateMany({
                where: {
                    providerId: paymentIntent.id,
                    orderId
                },
                data: {
                    status: enums_1.PaymentStatus.CANCELLED,
                    metadata: {
                        ...paymentIntent,
                        canceledAt: new Date().toISOString()
                    }
                }
            });
            // Update order
            await database_1.db.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: enums_1.PaymentStatus.CANCELLED
                }
            });
            console.log(`Payment canceled for order ${orderId}`);
        }
        catch (error) {
            console.error('Error handling payment cancellation:', error);
        }
    }
}
exports.PaymentController = PaymentController;
_a = PaymentController;
// POST /api/payments/intent - Create payment intent
PaymentController.createPaymentIntent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { orderId } = req.body;
    if (!orderId) {
        throw ApiError_1.ApiError.badRequest('Order ID is required');
    }
    // Get order details
    const order = await database_1.db.order.findUnique({
        where: { id: orderId },
        include: {
            items: true
        }
    });
    if (!order) {
        throw ApiError_1.ApiError.notFound('Order not found');
    }
    // Check if order already has a payment
    const existingPayment = await database_1.db.payment.findFirst({
        where: {
            orderId,
            status: {
                in: [enums_1.PaymentStatus.PENDING, enums_1.PaymentStatus.PROCESSING, enums_1.PaymentStatus.COMPLETED]
            }
        }
    });
    if (existingPayment) {
        throw ApiError_1.ApiError.badRequest('Payment already exists for this order');
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
        const payment = await database_1.db.payment.create({
            data: {
                orderId: order.id,
                amount: order.total,
                currency: order.currency,
                status: enums_1.PaymentStatus.PENDING,
                provider: 'stripe',
                providerId: paymentIntent.id,
                metadata: {
                    clientSecret: paymentIntent.client_secret
                }
            }
        });
        // Update order with payment ID
        await database_1.db.order.update({
            where: { id: order.id },
            data: {
                paymentId: payment.id,
                paymentStatus: enums_1.PaymentStatus.PENDING
            }
        });
        return response_1.ApiResponseUtil.success(res, {
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            amount: order.total,
            currency: order.currency
        }, 'Payment intent created successfully');
    }
    catch (stripeError) {
        throw ApiError_1.ApiError.internal(`Stripe error: ${stripeError.message}`);
    }
});
// POST /api/payments/confirm - Confirm payment (webhook handler)
PaymentController.confirmPayment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !webhookSecret) {
        throw ApiError_1.ApiError.badRequest('Invalid webhook signature');
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        throw ApiError_1.ApiError.badRequest(`Webhook signature verification failed: ${err.message}`);
    }
    // Handle different event types
    switch (event.type) {
        case 'payment_intent.succeeded':
            await _a.handlePaymentSucceeded(event.data.object);
            break;
        case 'payment_intent.payment_failed':
            await _a.handlePaymentFailed(event.data.object);
            break;
        case 'payment_intent.canceled':
            await _a.handlePaymentCanceled(event.data.object);
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
    return response_1.ApiResponseUtil.success(res, { received: true });
});
// GET /api/payments/:orderId - Get payment status for an order
PaymentController.getPaymentStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { orderId } = req.params;
    const payment = await database_1.db.payment.findFirst({
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
        throw ApiError_1.ApiError.notFound('Payment not found');
    }
    return response_1.ApiResponseUtil.success(res, {
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
PaymentController.createRefund = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { orderId, reason } = req.body;
    if (!orderId) {
        throw ApiError_1.ApiError.badRequest('Order ID is required');
    }
    // Get payment record
    const payment = await database_1.db.payment.findFirst({
        where: {
            orderId,
            status: enums_1.PaymentStatus.COMPLETED
        }
    });
    if (!payment) {
        throw ApiError_1.ApiError.notFound('No completed payment found for this order');
    }
    // Check if refund already exists
    const existingRefund = await database_1.db.refund.findFirst({
        where: { paymentId: payment.id }
    });
    if (existingRefund) {
        throw ApiError_1.ApiError.badRequest('Refund already processed for this payment');
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
        const refundRecord = await database_1.db.refund.create({
            data: {
                paymentId: payment.id,
                amount: payment.amount,
                reason: reason || 'Customer requested refund',
                status: refund.status === 'succeeded' ? 'COMPLETED' : 'PENDING',
                providerId: refund.id,
                metadata: refund
            }
        });
        // Update payment status
        await database_1.db.payment.update({
            where: { id: payment.id },
            data: {
                status: enums_1.PaymentStatus.REFUNDED
            }
        });
        // Update order status
        await database_1.db.order.update({
            where: { id: orderId },
            data: {
                status: enums_1.OrderStatus.REFUNDED,
                paymentStatus: enums_1.PaymentStatus.REFUNDED
            }
        });
        return response_1.ApiResponseUtil.success(res, refundRecord, 'Refund processed successfully');
    }
    catch (stripeError) {
        throw ApiError_1.ApiError.internal(`Stripe refund error: ${stripeError.message}`);
    }
});
