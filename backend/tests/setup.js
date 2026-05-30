// Test setup file for Jest
const { createClient } = require('@supabase/supabase-js');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.STRIPE_SECRET_KEY = 'sk_test_stripe_key';
process.env.PAYSTACK_SECRET_KEY = 'sk_test_paystack_key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock Supabase client for testing
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => ({
        data: null,
        error: null
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null
        }))
      }))
    })),
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      })),
      signInWithPassword: jest.fn(() => ({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      })),
      signUp: jest.fn(() => ({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      })),
      signOut: jest.fn(() => ({
        error: null
      }))
    }
  }))
}));

// Mock Stripe for testing
jest.mock('stripe', () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: jest.fn(() => ({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method'
      })),
      retrieve: jest.fn(() => ({
        id: 'pi_test_123',
        status: 'succeeded',
        metadata: { order_id: 'test-order-id' }
      }))
    },
    refunds: {
      create: jest.fn(() => ({
        id: 're_test_123',
        amount: 1000,
        status: 'succeeded'
      }))
    }
  }));
});

// Mock logger for testing
jest.mock('../src/utils/logger', () => ({
  auth: jest.fn(),
  payment: jest.fn(),
  order: jest.fn(),
  database: jest.fn(),
  api: jest.fn(),
  security: jest.fn(),
  performance: jest.fn(),
  rateLimit: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
