const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabase } = require('../config/supabase');

class PaymentService {
  async createPaymentIntent(orderId, amount) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'cad',
        metadata: {
          order_id: orderId
        }
      });

      return paymentIntent;
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw error;
    }
  }

  async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Update order status
        const orderId = paymentIntent.metadata.order_id;
        await supabase
          .from('orders')
          .update({ 
            status: 'paid',
            payment_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
      }

      return paymentIntent;
    } catch (error) {
      console.error('Confirm payment error:', error);
      throw error;
    }
  }

  async processRefund(orderId, amount) {
    try {
      // Get payment intent for the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('payment_intent_id')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      if (!order.payment_intent_id) {
        throw new Error('No payment intent found for this order');
      }

      const refund = await stripe.refunds.create({
        payment_intent: order.payment_intent_id,
        amount: Math.round(amount * 100) // Convert to cents
      });

      // Update order status
      await supabase
        .from('orders')
        .update({ 
          status: 'refunded',
          payment_status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      return refund;
    } catch (error) {
      console.error('Process refund error:', error);
      throw error;
    }
  }

  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.confirmPayment(event.data.object.id);
          break;
        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object;
          await supabase
            .from('orders')
            .update({ 
              status: 'payment_failed',
              payment_status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('payment_intent_id', failedPaymentIntent.id);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
