const paymentService = require('../../src/services/paymentService');

describe('Payment Service', () => {
  describe('Constructor', () => {
    it('should initialize with supported currencies and minimum amount', () => {
      expect(paymentService.supportedCurrencies).toContain('USD');
      expect(paymentService.supportedCurrencies).toContain('GHS');
      expect(paymentService.minimumAmount).toBe(0.50);
    });
  });

  describe('getPaymentMethodsForCurrency', () => {
    it('should return correct payment methods for GHS', () => {
      const methods = paymentService.getPaymentMethodsForCurrency('GHS');
      expect(methods).toEqual(['stripe', 'paystack']);
    });

    it('should return only stripe for USD', () => {
      const methods = paymentService.getPaymentMethodsForCurrency('USD');
      expect(methods).toEqual(['stripe']);
    });

    it('should return only stripe for unsupported currency', () => {
      const methods = paymentService.getPaymentMethodsForCurrency('JPY');
      expect(methods).toEqual(['stripe']);
    });
  });

  describe('generatePaystackReference', () => {
    it('should generate a unique reference with order ID', () => {
      const orderId = 'test-order-123';
      const reference = paymentService.generatePaystackReference(orderId);
      
      expect(reference).toContain('ASCO_');
      expect(reference).toContain(orderId);
      expect(reference.length).toBeGreaterThan(orderId.length + 10);
    });

    it('should generate different references for same order', () => {
      const orderId = 'test-order-123';
      const ref1 = paymentService.generatePaystackReference(orderId);
      const ref2 = paymentService.generatePaystackReference(orderId);
      
      expect(ref1).not.toBe(ref2);
    });
  });

  describe('createStripePaymentIntent', () => {
    it('should throw error for invalid order data', async () => {
      const invalidData = { orderId: '', amount: 0 };
      
      await expect(paymentService.createStripePaymentIntent(invalidData))
        .rejects.toThrow('Invalid order data or amount below minimum');
    });

    it('should throw error for unsupported currency', async () => {
      const invalidData = {
        orderId: 'test-order',
        amount: 10,
        currency: 'INVALID'
      };
      
      await expect(paymentService.createStripePaymentIntent(invalidData))
        .rejects.toThrow('Unsupported currency: INVALID');
    });

    it('should throw error for amount below minimum', async () => {
      const invalidData = {
        orderId: 'test-order',
        amount: 0.25,
        currency: 'USD'
      };
      
      await expect(paymentService.createStripePaymentIntent(invalidData))
        .rejects.toThrow('Invalid order data or amount below minimum');
    });
  });

  describe('createPaystackPayment', () => {
    it('should throw error for invalid order data', async () => {
      const invalidData = { orderId: '', amount: 0 };
      
      await expect(paymentService.createPaystackPayment(invalidData))
        .rejects.toThrow('Invalid order data or amount below minimum');
    });

    it('should throw error for amount below minimum', async () => {
      const invalidData = {
        orderId: 'test-order',
        amount: 0.25,
        customerEmail: 'test@example.com'
      };
      
      await expect(paymentService.createPaystackPayment(invalidData))
        .rejects.toThrow('Invalid order data or amount below minimum');
    });
  });

  describe('verifyPaystackPayment', () => {
    it('should throw error for invalid response', async () => {
      // Mock fetch to return failed response
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ status: false, message: 'Invalid reference' })
        })
      );

      await expect(paymentService.verifyPaystackPayment('invalid_ref'))
        .rejects.toThrow('Invalid reference');
    });

    it('should handle successful verification', async () => {
      // Mock fetch to return successful response
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({
            status: true,
            data: {
              status: 'success',
              reference: 'test_ref',
              amount: 1000,
              metadata: { order_id: 'test-order' }
            }
          })
        })
      );

      const result = await paymentService.verifyPaystackPayment('test_ref');
      expect(result.status).toBe('success');
      expect(result.reference).toBe('test_ref');
    });
  });

  describe('processStripeRefund', () => {
    it('should throw error when order not found', async () => {
      // Mock Supabase to return no order
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { message: 'Order not found' }
            }))
          }))
        }))
      });

      await expect(paymentService.processStripeRefund('invalid-order', 10))
        .rejects.toThrow('Order not found');
    });

    it('should throw error when payment not completed', async () => {
      // Mock Supabase to return order with unpaid status
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                payment_intent_id: 'pi_test',
                total_amount: 10,
                payment_status: 'pending'
              },
              error: null
            }))
          }))
        }))
      });

      await expect(paymentService.processStripeRefund('test-order', 10))
        .rejects.toThrow('Order cannot be refunded - payment not completed');
    });
  });
});
