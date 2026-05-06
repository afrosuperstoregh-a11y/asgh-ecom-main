const axios = require('axios');
const { supabase } = require('../config/supabase');

class PaystackService {
  constructor() {
    this.baseURL = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!this.secretKey) {
      console.warn('PAYSTACK_SECRET_KEY not found in environment variables');
    }
  }

  /**
   * Initialize a Paystack transaction
   * @param {Object} paymentData - Payment data
   * @param {string} paymentData.email - Customer email
   * @param {number} paymentData.amount - Amount in GHS (will be converted to pesewas)
   * @param {string} paymentData.reference - Unique transaction reference
   * @param {Object} paymentData.metadata - Additional metadata
   * @returns {Promise<Object>} Paystack initialization response
   */
  async initializeTransaction(paymentData) {
    try {
      const { email, amount, reference, metadata = {} } = paymentData;
      
      if (!email || !amount) {
        throw new Error('Email and amount are required');
      }

      // Convert GHS to pesewas (multiply by 100)
      const amountInPesewas = Math.round(amount * 100);

      const payload = {
        email,
        amount: amountInPesewas,
        currency: 'GHS',
        reference,
        metadata: {
          ...metadata,
          currency: 'GHS',
          original_amount: amount,
          amount_in_pesewas: amountInPesewas
        },
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/verify`,
        channels: ['mobile_money', 'card', 'bank', 'ussd', 'bank_transfer']
      };

      const response = await axios.post(`${this.baseURL}/transaction/initialize`, payload, {
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Paystack transaction initialized:', {
        reference,
        amount: amountInPesewas,
        email,
        status: 'initialized'
      });

      return response.data;
    } catch (error) {
      console.error('Paystack initialization error:', error.response?.data || error.message);
      throw new Error(`Paystack initialization failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify a Paystack transaction
   * @param {string} reference - Transaction reference to verify
   * @returns {Promise<Object>} Paystack verification response
   */
  async verifyTransaction(reference) {
    try {
      if (!reference) {
        throw new Error('Transaction reference is required');
      }

      const response = await axios.get(`${this.baseURL}/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      const verificationData = response.data;
      
      console.log('Paystack transaction verification:', {
        reference,
        status: verificationData.status,
        amount: verificationData.data?.amount,
        paid_at: verificationData.data?.paid_at
      });

      return verificationData;
    } catch (error) {
      console.error('Paystack verification error:', error.response?.data || error.message);
      throw new Error(`Paystack verification failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Handle Paystack webhook events
   * @param {Object} event - Paystack webhook event
   * @returns {Promise<Object>} Processing result
   */
  async handleWebhook(event) {
    try {
      const { event: eventType, data } = event;

      console.log('Paystack webhook received:', {
        event: eventType,
        reference: data.reference,
        status: data.status,
        amount: data.amount
      });

      switch (eventType) {
        case 'charge.success':
          await this.handleSuccessfulPayment(data);
          break;
        
        case 'charge.failed':
          await this.handleFailedPayment(data);
          break;
        
        case 'transfer.success':
          console.log('Transfer successful:', data);
          break;
        
        case 'transfer.failed':
          console.log('Transfer failed:', data);
          break;
        
        default:
          console.log(`Unhandled Paystack event type: ${eventType}`);
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      console.error('Paystack webhook processing error:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   * @param {Object} paymentData - Payment data from Paystack
   */
  async handleSuccessfulPayment(paymentData) {
    try {
      const { reference, metadata, amount, customer } = paymentData;
      
      // Update order status in database
      if (metadata?.order_id) {
        await supabase
          .from('orders')
          .update({
            status: 'paid',
            payment_status: 'completed',
            payment_provider: 'paystack',
            currency: 'GHS',
            payment_reference: reference,
            payment_details: {
              provider: 'paystack',
              reference,
              amount: amount / 100, // Convert back to GHS
              customer_email: customer?.email,
              paid_at: new Date().toISOString(),
              metadata
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', metadata.order_id);

        console.log(`Order ${metadata.order_id} marked as paid via Paystack`);
      }
    } catch (error) {
      console.error('Error handling successful Paystack payment:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   * @param {Object} paymentData - Payment data from Paystack
   */
  async handleFailedPayment(paymentData) {
    try {
      const { reference, metadata } = paymentData;
      
      // Update order status in database
      if (metadata?.order_id) {
        await supabase
          .from('orders')
          .update({
            status: 'payment_failed',
            payment_status: 'failed',
            payment_provider: 'paystack',
            currency: 'GHS',
            payment_reference: reference,
            payment_details: {
              provider: 'paystack',
              reference,
              failed_at: new Date().toISOString(),
              metadata
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', metadata.order_id);

        console.log(`Order ${metadata.order_id} marked as payment failed via Paystack`);
      }
    } catch (error) {
      console.error('Error handling failed Paystack payment:', error);
      throw error;
    }
  }

  /**
   * Get transaction status
   * @param {string} reference - Transaction reference
   * @returns {Promise<Object>} Transaction status
   */
  async getTransactionStatus(reference) {
    try {
      const response = await axios.get(`${this.baseURL}/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        status: response.data.status,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error getting transaction status:', error);
      throw error;
    }
  }

  /**
   * Generate unique transaction reference
   * @returns {string} Unique reference
   */
  generateReference() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `paystack_${timestamp}_${random}`;
  }
}

module.exports = new PaystackService();
