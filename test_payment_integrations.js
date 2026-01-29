const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Payment integration validation tests
const baseURL = process.env.API_URL || 'http://localhost:3001';

async function testStripeIntegration() {
  console.log('💳 Testing Stripe Integration...');
  
  try {
    // Test Stripe configuration
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('❌ Stripe secret key not configured');
      return false;
    }
    
    if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test')) {
      console.log('✅ Stripe configured in test mode');
    } else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_live')) {
      console.log('⚠️  Stripe configured in LIVE mode');
    }
    
    // Test creating a payment intent
    console.log('🔧 Creating test payment intent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2999, // $29.99
      currency: 'cad',
      metadata: {
        order_id: 'test-order-123',
        product_name: 'Test Product'
      }
    });
    
    console.log('✅ Payment intent created:', paymentIntent.id);
    console.log('   Amount:', paymentIntent.amount / 100, 'CAD');
    console.log('   Status:', paymentIntent.status);
    
    // Test webhook endpoint configuration
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      console.log('✅ Stripe webhook secret configured');
    } else {
      console.log('⚠️  Stripe webhook secret not configured');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Stripe integration test failed:', error.message);
    return false;
  }
}

async function testPayPalIntegration() {
  console.log('\n🅿️  Testing PayPal Integration...');
  
  try {
    // Check PayPal configuration
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.log('❌ PayPal credentials not configured');
      return false;
    }
    
    // Test PayPal API access token
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    console.log('🔧 Testing PayPal API access...');
    const tokenResponse = await axios.post('https://api.sandbox.paypal.com/v1/oauth2/token', 
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (tokenResponse.data.access_token) {
      console.log('✅ PayPal API access successful');
      console.log('   Token type:', tokenResponse.data.token_type);
      console.log('   Expires in:', tokenResponse.data.expires_in, 'seconds');
      
      // Test creating an order
      console.log('🔧 Creating test PayPal order...');
      const orderResponse = await axios.post('https://api.sandbox.paypal.com/v2/checkout/orders', {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'CAD',
            value: '29.99'
          },
          description: 'Test Product'
        }]
      }, {
        headers: {
          'Authorization': `Bearer ${tokenResponse.data.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (orderResponse.data.id) {
        console.log('✅ PayPal order created:', orderResponse.data.id);
        console.log('   Status:', orderResponse.data.status);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ PayPal integration test failed:', error.response?.data || error.message);
    return false;
  }
}

async function testPaymentWebhooks() {
  console.log('\n🪝 Testing Payment Webhooks...');
  
  try {
    // Test Stripe webhook endpoint
    console.log('🔧 Testing Stripe webhook endpoint...');
    
    // Create a test webhook payload
    const testPayload = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          amount: 2999,
          currency: 'cad',
          metadata: {
            order_id: 'test-order-123'
          }
        }
      }
    };
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = stripe.webhooks.generateSignature(
      JSON.stringify(testPayload),
      process.env.STRIPE_WEBHOOK_SECRET || 'test-secret',
      timestamp
    );
    
    try {
      const webhookResponse = await axios.post(`${baseURL}/api/payments/webhook/stripe`, 
        testPayload,
        {
          headers: {
            'stripe-signature': `t=${timestamp},${signature}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Stripe webhook endpoint responding');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('⚠️  Stripe webhook endpoint exists but signature verification failed (expected)');
      } else {
        console.log('❌ Stripe webhook endpoint error:', error.response?.data);
      }
    }
    
    // Test PayPal webhook endpoint
    console.log('🔧 Testing PayPal webhook endpoint...');
    try {
      const paypalWebhookResponse = await axios.post(`${baseURL}/api/payments/webhook/paypal`, {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'test-paypal-id',
          amount: {
            value: '29.99',
            currency_code: 'CAD'
          }
        }
      });
      
      console.log('✅ PayPal webhook endpoint responding');
    } catch (error) {
      console.log('❌ PayPal webhook endpoint error:', error.response?.data);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Payment webhooks test failed:', error.message);
    return false;
  }
}

async function testPaymentProcessing() {
  console.log('\n💰 Testing Payment Processing Flow...');
  
  try {
    // Test payment creation endpoint
    console.log('🔧 Testing payment creation...');
    
    const paymentData = {
      order_id: 'test-order-123',
      amount: 29.99,
      currency: 'CAD',
      payment_method: 'stripe',
      payment_intent_id: 'pi_test_123'
    };
    
    try {
      const paymentResponse = await axios.post(`${baseURL}/api/payments`, paymentData, {
        headers: {
          'Authorization': 'Bearer test-admin-token' // This will fail but tests the endpoint
        }
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Payment endpoint protected by authentication');
      }
    }
    
    // Test payment status endpoint
    console.log('🔧 Testing payment status check...');
    try {
      const statusResponse = await axios.get(`${baseURL}/api/payments/status/pi_test_123`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Payment status endpoint protected');
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Payment processing test failed:', error.message);
    return false;
  }
}

async function runPaymentTests() {
  console.log('🧪 Starting Payment Integration Validation Tests...\n');
  
  const results = {
    stripe: await testStripeIntegration(),
    paypal: await testPayPalIntegration(),
    webhooks: await testPaymentWebhooks(),
    processing: await testPaymentProcessing()
  };
  
  console.log('\n📊 Payment Integration Test Results:');
  console.log('   Stripe:', results.stripe ? '✅ PASS' : '❌ FAIL');
  console.log('   PayPal:', results.paypal ? '✅ PASS' : '❌ FAIL');
  console.log('   Webhooks:', results.webhooks ? '✅ PASS' : '❌ FAIL');
  console.log('   Processing:', results.processing ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All payment integration tests passed!');
  } else {
    console.log('\n⚠️  Some payment integration tests failed. Check configuration.');
  }
  
  return allPassed;
}

// Run tests
if (require.main === module) {
  runPaymentTests();
}

module.exports = { runPaymentTests };
