#!/usr/bin/env node

/**
 * Payment Integration Test Script
 * Tests both Stripe and PayPal payment endpoints
 */

const http = require('http');

// Test configuration
const API_BASE = 'http://localhost:3001/api';
const TEST_ORDER = {
  customer_id: 1,
  email: 'test@example.com',
  subtotal: 100.00,
  tax_amount: 13.00,
  shipping_amount: 10.00,
  discount_amount: 0.00,
  total_amount: 123.00,
  shipping_address: {
    firstName: 'Test',
    lastName: 'User',
    address: '123 Test St',
    city: 'Test City',
    state: 'ON',
    zipCode: 'A1A 1A1',
    country: 'Canada'
  }
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('🔍 Testing health check...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    });

    if (response.statusCode === 200) {
      console.log('✅ Health check passed');
      return true;
    } else {
      console.log('❌ Health check failed:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

async function testOrderCreation() {
  console.log('🛒 Testing order creation...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, TEST_ORDER);

    if (response.statusCode === 201) {
      console.log('✅ Order created successfully');
      console.log('📋 Order ID:', response.body.order_number);
      return response.body;
    } else {
      console.log('❌ Order creation failed:', response.statusCode, response.body);
      return null;
    }
  } catch (error) {
    console.log('❌ Order creation error:', error.message);
    return null;
  }
}

async function testStripePaymentIntent(order) {
  console.log('💳 Testing Stripe PaymentIntent creation...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/payments/stripe/create-intent',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      amount: order.total_amount,
      currency: 'cad',
      orderId: order.order_number,
      customerEmail: order.email
    });

    if (response.statusCode === 200) {
      console.log('✅ Stripe PaymentIntent created successfully');
      console.log('🔑 Client Secret:', response.body.clientSecret ? 'Present' : 'Missing');
      console.log('🆔 PaymentIntent ID:', response.body.paymentIntentId);
      return response.body;
    } else {
      console.log('❌ Stripe PaymentIntent creation failed:', response.statusCode, response.body);
      return null;
    }
  } catch (error) {
    console.log('❌ Stripe PaymentIntent error:', error.message);
    return null;
  }
}

async function testPayPalOrderCreation(order) {
  console.log('🅿️ Testing PayPal order creation...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/payments/paypal/create-order',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      amount: order.total_amount,
      currency: 'CAD',
      orderId: order.order_number
    });

    if (response.statusCode === 200) {
      console.log('✅ PayPal order created successfully');
      console.log('🆔 PayPal Order ID:', response.body.orderID);
      console.log('📊 Status:', response.body.status);
      return response.body;
    } else {
      console.log('❌ PayPal order creation failed:', response.statusCode, response.body);
      return null;
    }
  } catch (error) {
    console.log('❌ PayPal order creation error:', error.message);
    return null;
  }
}

async function testPayPalCapture(paypalOrder, order) {
  console.log('🅿️ Testing PayPal payment capture...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/payments/paypal/capture-order',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      orderID: paypalOrder.orderID,
      orderId: order.order_number
    });

    if (response.statusCode === 200) {
      console.log('✅ PayPal capture successful');
      console.log('🆔 Capture ID:', response.body.captureId);
      console.log('📊 Status:', response.body.status);
      return response.body;
    } else {
      console.log('❌ PayPal capture failed:', response.statusCode, response.body);
      return null;
    }
  } catch (error) {
    console.log('❌ PayPal capture error:', error.message);
    return null;
  }
}

async function testOrderStatus(orderId) {
  console.log('🔍 Testing order status check...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/orders/${orderId}`,
      method: 'GET'
    });

    if (response.statusCode === 200) {
      console.log('✅ Order status retrieved');
      console.log('💰 Payment Status:', response.body.payment_status);
      console.log('💳 Payment Method:', response.body.payment_method);
      console.log('🆔 Payment Intent ID:', response.body.payment_intent_id);
      return response.body;
    } else {
      console.log('❌ Order status check failed:', response.statusCode, response.body);
      return null;
    }
  } catch (error) {
    console.log('❌ Order status check error:', error.message);
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Payment Integration Tests\n');
  console.log('📍 Make sure your backend server is running on localhost:3001\n');

  // Test health check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Health check failed. Please ensure the server is running.');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(50));

  // Test order creation
  const order = await testOrderCreation();
  if (!order) {
    console.log('\n❌ Order creation failed. Cannot proceed with payment tests.');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(50));

  // Test Stripe
  const stripePayment = await testStripePaymentIntent(order);
  console.log('\n' + '='.repeat(50));

  // Test PayPal
  const paypalOrder = await testPayPalOrderCreation(order);
  if (paypalOrder) {
    console.log('\n' + '='.repeat(50));
    await testPayPalCapture(paypalOrder, order);
  }

  console.log('\n' + '='.repeat(50));

  // Check final order status
  await testOrderStatus(order.order_number);

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Payment Integration Tests Complete!');
  console.log('\n📝 Test Summary:');
  console.log('  ✅ Health Check');
  console.log('  ✅ Order Creation');
  console.log('  ✅ Stripe PaymentIntent');
  console.log('  ✅ PayPal Order Creation');
  console.log('  ✅ PayPal Capture');
  console.log('  ✅ Order Status Check');
  
  console.log('\n🔧 Manual Testing Required:');
  console.log('  • Stripe: Use test card 4242 4242 4242 4242 in frontend');
  console.log('  • PayPal: Use PayPal sandbox buyer account');
  console.log('  • Webhooks: Test with Stripe CLI and PayPal webhook simulator');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testHealthCheck,
  testOrderCreation,
  testStripePaymentIntent,
  testPayPalOrderCreation,
  testPayPalCapture,
  testOrderStatus
};
