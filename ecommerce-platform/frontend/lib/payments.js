import { API_BASE_URL, apiRequest } from './api';

// Payment integration utilities
export const payments = {
  // Create Stripe payment intent
  createPaymentIntent: async (orderData) => {
    try {
      const response = await apiRequest('/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
      
      if (response.success) {
        return response;
      }
      
      throw new Error(response.message || 'Payment intent creation failed');
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw error;
    }
  },

  // Confirm Stripe payment
  confirmPayment: async (paymentIntentId, paymentMethodId) => {
    try {
      const response = await apiRequest('/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
          payment_method_id: paymentMethodId,
        }),
      });
      
      if (response.success) {
        return response;
      }
      
      throw new Error(response.message || 'Payment confirmation failed');
    } catch (error) {
      console.error('Confirm payment error:', error);
      throw error;
    }
  },

  // Process PayPal payment
  processPayPalPayment: async (orderData) => {
    try {
      const response = await apiRequest('/payments/paypal/create', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
      
      if (response.success) {
        return response;
      }
      
      throw new Error(response.message || 'PayPal payment creation failed');
    } catch (error) {
      console.error('PayPal payment error:', error);
      throw error;
    }
  },

  // Capture PayPal payment
  capturePayPalPayment: async (orderId, payerId) => {
    try {
      const response = await apiRequest('/payments/paypal/capture', {
        method: 'POST',
        body: JSON.stringify({
          order_id: orderId,
          payer_id: payerId,
        }),
      });
      
      if (response.success) {
        return response;
      }
      
      throw new Error(response.message || 'PayPal payment capture failed');
    } catch (error) {
      console.error('PayPal capture error:', error);
      throw error;
    }
  },

  // Get payment methods
  getPaymentMethods: async () => {
    try {
      const response = await apiRequest('/payments/methods');
      
      if (response.success) {
        return response.methods;
      }
      
      return [];
    } catch (error) {
      console.error('Get payment methods error:', error);
      return [];
    }
  },

  // Get payment status
  getPaymentStatus: async (paymentId) => {
    try {
      const response = await apiRequest(`/payments/status/${paymentId}`);
      
      if (response.success) {
        return response.status;
      }
      
      return null;
    } catch (error) {
      console.error('Get payment status error:', error);
      return null;
    }
  },

  // Process refund
  processRefund: async (paymentId, amount, reason) => {
    try {
      const response = await apiRequest('/payments/refund', {
        method: 'POST',
        body: JSON.stringify({
          payment_id: paymentId,
          amount,
          reason,
        }),
      });
      
      if (response.success) {
        return response;
      }
      
      throw new Error(response.message || 'Refund processing failed');
    } catch (error) {
      console.error('Process refund error:', error);
      throw error;
    }
  },

  // Get transaction history
  getTransactionHistory: async (filters = {}) => {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const response = await apiRequest(`/payments/transactions?${queryString}`);
      
      if (response.success) {
        return response.transactions;
      }
      
      return [];
    } catch (error) {
      console.error('Get transaction history error:', error);
      return [];
    }
  },

  // Initialize Stripe (client-side)
  initStripe: async () => {
    try {
      const response = await apiRequest('/payments/stripe/config');
      
      if (response.success && response.publishableKey) {
        // Load Stripe.js if not already loaded
        if (!window.Stripe) {
          const script = document.createElement('script');
          script.src = 'https://js.stripe.com/v3/';
          script.onload = () => {
            window.stripe = window.Stripe(response.publishableKey);
          };
          document.head.appendChild(script);
        } else {
          window.stripe = window.Stripe(response.publishableKey);
        }
        
        return response.publishableKey;
      }
      
      throw new Error('Failed to initialize Stripe');
    } catch (error) {
      console.error('Init Stripe error:', error);
      throw error;
    }
  },

  // Create payment element
  createPaymentElement: async (clientSecret) => {
    if (!window.stripe) {
      await payments.initStripe();
    }

    if (!window.stripeElements) {
      window.stripeElements = window.stripe.elements();
    }

    const paymentElement = window.stripeElements.create('payment', {
      clientSecret,
    });

    return paymentElement;
  },

  // Handle payment submission
  handlePaymentSubmit: async (clientSecret, paymentElement) => {
    if (!window.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const { error } = await window.stripe.confirmPayment({
        elements: paymentElement,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Payment submission error:', error);
      throw error;
    }
  }
};

export default payments;
