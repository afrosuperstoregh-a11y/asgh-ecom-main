const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const { ApiResponse } = require('../middleware/apiResponse');

// Initialize Supabase client (Realtime disabled - not used in backend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

class PaymentService {
  constructor() {
    this.supportedCurrencies = ['USD', 'GHS', 'EUR', 'GBP'];
    this.minimumAmount = 0.50; // Minimum amount in currency
  }

  /**
   * Create a Stripe payment intent
   */
  async createStripePaymentIntent(orderData) {
    try {
      const { orderId, amount, currency = 'GHS', customerEmail } = orderData;

      // Validate inputs
      if (!orderId || !amount || amount < this.minimumAmount) {
        throw new Error('Invalid order data or amount below minimum');
      }

      if (!this.supportedCurrencies.includes(currency)) {
        throw new Error(`Unsupported currency: ${currency}`);
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to smallest currency unit
        currency: currency.toLowerCase(),
        metadata: {
          order_id: orderId,
          customer_email: customerEmail,
          platform: 'afro_superstore'
        },
        automatic_payment_methods: {
          enabled: true
        },
        payment_method_types: ['card'],
        receipt_email: customerEmail
      });

      // Log payment intent creation
      logger.payment('Stripe payment intent created', true, {
        paymentIntentId: paymentIntent.id,
        orderId,
        amount,
        currency,
        customerEmail
      });

      // Update order with payment intent ID
      await this.updateOrderPaymentIntent(orderId, paymentIntent.id, 'stripe');

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };

    } catch (error) {
      logger.payment('Stripe payment intent creation failed', false, {
        error: error.message,
        orderId: orderData.orderId,
        amount: orderData.amount
      });
      throw error;
    }
  }

  /**
   * Create a Paystack payment transaction
   */
  async createPaystackPayment(orderData) {
    try {
      const { orderId, amount, customerEmail, callbackUrl } = orderData;

      // Validate inputs
      if (!orderId || !amount || amount < this.minimumAmount) {
        throw new Error('Invalid order data or amount below minimum');
      }

      // Convert amount to kobo (GHS cents)
      const amountInKobo = Math.round(amount * 100);

      // Paystack payment data
      const paymentData = {
        amount: amountInKobo,
        email: customerEmail,
        currency: 'GHS',
        reference: this.generatePaystackReference(orderId),
        callback_url: callbackUrl || `${process.env.FRONTEND_URL}/payment/verify`,
        metadata: {
          order_id: orderId,
          platform: 'afro_superstore'
        }
      };

      // Initialize Paystack transaction
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (!result.status) {
        throw new Error(result.message || 'Paystack initialization failed');
      }

      // Log Paystack payment creation
      logger.payment('Paystack payment initialized', true, {
        reference: result.data.reference,
        orderId,
        amount,
        customerEmail
      });

      // Update order with Paystack reference
      await this.updateOrderPaymentIntent(orderId, result.data.reference, 'paystack');

      return {
        success: true,
        authorizationUrl: result.data.authorization_url,
        reference: result.data.reference
      };

    } catch (error) {
      logger.payment('Paystack payment initialization failed', false, {
        error: error.message,
        orderId: orderData.orderId,
        amount: orderData.amount
      });
      throw error;
    }
  }

  /**
   * Verify Paystack payment
   */
  async verifyPaystackPayment(reference) {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      });

      const result = await response.json();

      if (!result.status) {
        throw new Error(result.message || 'Payment verification failed');
      }

      const paymentData = result.data;

      if (paymentData.status === 'success') {
        // Update order status
        await this.confirmPaystackPayment(paymentData);
        
        logger.payment('Paystack payment verified and confirmed', true, {
          reference,
          orderId: paymentData.metadata.order_id,
          amount: paymentData.amount / 100
        });
      }

      return paymentData;

    } catch (error) {
      logger.payment('Paystack payment verification failed', false, {
        error: error.message,
        reference
      });
      throw error;
    }
  }

  /**
   * Confirm Paystack payment
   */
  async confirmPaystackPayment(paymentData) {
    const orderId = paymentData.metadata?.order_id;
    
    if (!orderId) {
      throw new Error('Order ID not found in payment metadata');
    }

    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'confirmed',
        payment_status: 'paid',
        payment_method: 'paystack',
        payment_intent_id: paymentData.reference,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      throw new Error(`Failed to update order: ${error.message}`);
    }

    // Create payment record
    await this.createPaymentRecord({
      orderId,
      amount: paymentData.amount / 100,
      currency: 'GHS',
      paymentMethod: 'paystack',
      paymentIntentId: paymentData.reference,
      status: 'succeeded',
      gatewayResponse: paymentData
    });
  }

  /**
   * Process refund for Stripe
   */
  async processStripeRefund(orderId, amount, reason = 'requested_by_customer') {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('payment_intent_id, total_amount, payment_status')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error('Order not found');
      }

      if (order.payment_status !== 'paid') {
        throw new Error('Order cannot be refunded - payment not completed');
      }

      if (!order.payment_intent_id) {
        throw new Error('No payment intent found for this order');
      }

      const refundAmount = amount || order.total_amount;

      // Create Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: order.payment_intent_id,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: reason,
        metadata: {
          order_id: orderId
        }
      });

      // Update order status
      await this.updateOrderRefundStatus(orderId, refundAmount, refund.id);

      logger.payment('Stripe refund processed', true, {
        orderId,
        refundId: refund.id,
        refundAmount,
        reason
      });

      return refund;

    } catch (error) {
      logger.payment('Stripe refund processing failed', false, {
        error: error.message,
        orderId,
        amount
      });
      throw error;
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleStripeWebhook(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleStripePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handleStripePaymentFailure(event.data.object);
          break;
        case 'payment_intent.requires_action':
          await this.handleStripePaymentAction(event.data.object);
          break;
        case 'charge.dispute.created':
          await this.handleStripeDispute(event.data.object);
          break;
        default:
          logger.payment(`Unhandled Stripe event type: ${event.type}`, true, {
            eventType: event.type
          });
      }

    } catch (error) {
      logger.payment('Stripe webhook handling failed', false, {
        error: error.message,
        eventType: event.type
      });
      throw error;
    }
  }

  /**
   * Handle successful Stripe payment
   */
  async handleStripePaymentSuccess(paymentIntent) {
    const orderId = paymentIntent.metadata?.order_id;
    
    if (!orderId) {
      logger.payment('Stripe payment success - no order ID', false, {
        paymentIntentId: paymentIntent.id
      });
      return;
    }

    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'confirmed',
        payment_status: 'paid',
        payment_method: 'stripe',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      logger.payment('Failed to update order after Stripe payment', false, {
        orderId,
        error: error.message
      });
      return;
    }

    // Create payment record
    await this.createPaymentRecord({
      orderId,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      paymentMethod: 'stripe',
      paymentIntentId: paymentIntent.id,
      status: 'succeeded',
      gatewayResponse: paymentIntent
    });

    logger.payment('Stripe payment processed successfully', true, {
      orderId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100
    });
  }

  /**
   * Handle failed Stripe payment
   */
  async handleStripePaymentFailure(paymentIntent) {
    const orderId = paymentIntent.metadata?.order_id;
    
    if (!orderId) return;

    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'payment_failed',
        payment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (!error) {
      logger.payment('Stripe payment failed', true, {
        orderId,
        paymentIntentId: paymentIntent.id,
        lastPaymentError: paymentIntent.last_payment_error?.message
      });
    }
  }

  /**
   * Update order with payment intent ID
   */
  async updateOrderPaymentIntent(orderId, paymentIntentId, paymentMethod) {
    const { error } = await supabase
      .from('orders')
      .update({ 
        payment_intent_id: paymentIntentId,
        payment_method: paymentMethod,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      throw new Error(`Failed to update order payment intent: ${error.message}`);
    }
  }

  /**
   * Create payment record
   */
  async createPaymentRecord(paymentData) {
    const { error } = await supabase
      .from('payments')
      .insert({
        order_id: paymentData.orderId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: paymentData.status,
        payment_method: paymentData.paymentMethod,
        payment_intent_id: paymentData.paymentIntentId,
        gateway_response: paymentData.gatewayResponse,
        processed_at: new Date().toISOString()
      });

    if (error) {
      logger.payment('Failed to create payment record', false, {
        error: error.message,
        orderId: paymentData.orderId
      });
    }
  }

  /**
   * Update order refund status
   */
  async updateOrderRefundStatus(orderId, refundAmount, refundId) {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'refunded',
        payment_status: 'refunded',
        refund_amount: refundAmount,
        refund_id: refundId,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      throw new Error(`Failed to update order refund status: ${error.message}`);
    }
  }

  /**
   * Generate Paystack reference
   */
  generatePaystackReference(orderId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ASCO_${orderId}_${timestamp}_${random}`;
  }

  /**
   * Get payment methods for currency
   */
  getPaymentMethodsForCurrency(currency) {
    const methods = {
      'GHS': ['stripe', 'paystack'],
      'USD': ['stripe'],
      'EUR': ['stripe'],
      'GBP': ['stripe']
    };
    return methods[currency] || ['stripe'];
  }
}

module.exports = new PaymentService();
