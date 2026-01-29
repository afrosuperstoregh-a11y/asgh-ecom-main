const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { Pool } = require('pg');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { updateOrderPayment } = require('./orders');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create payments table if it doesn't exist
async function createPaymentsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL,
      order_number VARCHAR(50) NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      payment_intent_id VARCHAR(255),
      transaction_id VARCHAR(255),
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'CAD',
      status VARCHAR(50) NOT NULL,
      gateway_response JSONB,
      failure_reason TEXT,
      processed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_order_number ON payments(order_number);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
  `;
  
  try {
    await pool.query(query);
    console.log('✅ Payments table ready');
  } catch (error) {
    console.error('❌ Error creating payments table:', error);
  }
}

// Get all payments (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, payment_method, start_date, end_date, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        p.*,
        o.customer_id,
        o.email as customer_email,
        u.first_name,
        u.last_name
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      LEFT JOIN users u ON o.customer_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (payment_method) {
      query += ` AND p.payment_method = $${paramIndex++}`;
      params.push(payment_method);
    }
    
    if (start_date) {
      query += ` AND p.created_at >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND p.created_at <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
});

// Get payment statistics (admin only)
router.get('/stats/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE created_at BETWEEN $1 AND $2';
      params.push(start_date, end_date);
    }
    
    // Overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
        COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status = 'succeeded' THEN amount END), 0) as avg_payment_amount
      FROM payments
      ${dateFilter}
    `;
    
    const statsResult = await pool.query(statsQuery, params);
    
    // Payment method breakdown
    const methodQuery = `
      SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END), 0) as revenue
      FROM payments
      ${dateFilter}
      GROUP BY payment_method
      ORDER BY revenue DESC
    `;
    
    const methodResult = await pool.query(methodQuery, params);
    
    res.json({
      success: true,
      data: {
        summary: statsResult.rows[0],
        payment_methods: methodResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics'
    });
  }
});

// Get single payment (admin only or own payment)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query, params;
    
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      // Admin can see any payment
      query = `
        SELECT 
          p.*,
          o.customer_id,
          o.email as customer_email,
          u.first_name,
          u.last_name
        FROM payments p
        LEFT JOIN orders o ON p.order_id = o.id
        LEFT JOIN users u ON o.customer_id = u.id
        WHERE p.id = $1 OR p.payment_intent_id = $1
      `;
      params = [id];
    } else {
      // Customers can only see their own payments
      query = `
        SELECT 
          p.*,
          o.customer_id,
          o.email as customer_email
        FROM payments p
        LEFT JOIN orders o ON p.order_id = o.id
        WHERE (p.id = $1 OR p.payment_intent_id = $1) AND o.customer_id = $2
      `;
      params = [id, req.user.id];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment'
    });
  }
});

// Create payment record (internal use)
router.post('/record', async (req, res) => {
  try {
    const {
      order_id,
      order_number,
      payment_method,
      payment_intent_id,
      transaction_id,
      amount,
      currency = 'CAD',
      status = 'pending',
      gateway_response
    } = req.body;
    
    const query = `
      INSERT INTO payments (
        order_id, order_number, payment_method, payment_intent_id,
        transaction_id, amount, currency, status, gateway_response
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      order_id, order_number, payment_method, payment_intent_id,
      transaction_id, amount, currency, status, 
      gateway_response ? JSON.stringify(gateway_response) : null
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      message: 'Payment record created',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment record'
    });
  }
});

// Create Stripe PaymentIntent
router.post('/stripe/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'cad', orderId, customerEmail } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Create PaymentIntent with existing order data
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        orderId: orderId || 'unknown',
        customerEmail: customerEmail || 'unknown'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Stripe PaymentIntent creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      message: error.message 
    });
  }
});

// Confirm payment (client-side confirmation)
router.post('/stripe/confirm', async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'PaymentIntent ID is required' });
    }

    // Retrieve the PaymentIntent to confirm status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
      orderId: orderId,
    });
  } catch (error) {
    console.error('Stripe payment confirmation error:', error);
    res.status(500).json({ 
      error: 'Failed to confirm payment',
      message: error.message 
    });
  }
});

// Stripe webhook handler
router.post('/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      
      // Update order status in database
      try {
        await updateOrderPayment(paymentIntent.metadata.orderId, {
          paymentStatus: 'paid',
          paymentMethod: 'stripe',
          paymentIntentId: paymentIntent.id,
        });
        console.log('Order payment updated successfully');
      } catch (error) {
        console.error('Failed to update order payment:', error);
      }
      
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed:', failedPayment.id);
      
      // Update order status to failed
      try {
        await updateOrderPayment(failedPayment.metadata.orderId, {
          paymentStatus: 'failed',
          paymentMethod: 'stripe',
          paymentIntentId: failedPayment.id
        });
        console.log('Order payment status updated to failed');
      } catch (error) {
        console.error('Failed to update order payment status:', error);
      }
      
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
});

// Get payment details
router.get('/stripe/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
      created: paymentIntent.created
    });
  } catch (error) {
    console.error('Stripe payment retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve payment',
      message: error.message 
    });
  }
});

// PayPal Create Order
router.post('/paypal/create-order', async (req, res) => {
  try {
    const { amount, currency = 'CAD', orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // PayPal order creation (simplified version - would use PayPal SDK in production)
    const paypalOrder = {
      id: 'PAYPAL-' + Math.random().toString(36).substring(2).toUpperCase(),
      status: 'CREATED',
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: orderId || 'unknown',
        amount: {
          currency_code: currency,
          value: amount.toFixed(2)
        }
      }]
    };

    res.json({
      orderID: paypalOrder.id,
      status: paypalOrder.status
    });
  } catch (error) {
    console.error('PayPal order creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create PayPal order',
      message: error.message 
    });
  }
});

// PayPal Capture Payment
router.post('/paypal/capture-order', async (req, res) => {
  try {
    const { orderID, orderId } = req.body;

    if (!orderID) {
      return res.status(400).json({ error: 'PayPal Order ID is required' });
    }

    // PayPal capture (simplified version - would use PayPal SDK in production)
    const captureData = {
      status: 'COMPLETED',
      id: 'CAPTURE-' + Math.random().toString(36).substring(2).toUpperCase(),
      orderID: orderID,
      amount: {
        currency_code: 'CAD',
        value: '0.00' // Would get from actual PayPal order
      }
    };

    res.json({
      status: 'COMPLETED',
      captureId: captureData.id,
      orderId: orderId
    });
  } catch (error) {
    console.error('PayPal capture error:', error);
    res.status(500).json({ 
      error: 'Failed to capture PayPal payment',
      message: error.message 
    });
  }
});

// PayPal Webhook Handler
router.post('/paypal/webhook', async (req, res) => {
  try {
    const event = req.body;
    
    // Verify PayPal webhook signature (simplified - would use PayPal SDK)
    console.log('PayPal webhook received:', event.event_type);

    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        const approvedOrder = event.resource;
        console.log('PayPal order approved:', approvedOrder.id);
        
        // Update order status in database
        try {
          const orderId = approvedOrder.purchase_units?.[0]?.reference_id || 'unknown';
          await updateOrderPayment(orderId, {
            paymentStatus: 'paid',
            paymentMethod: 'paypal',
            paymentIntentId: approvedOrder.id,
          });
          console.log('PayPal order payment updated successfully');
        } catch (error) {
          console.error('Failed to update PayPal order payment:', error);
        }
        
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        const capturedPayment = event.resource;
        console.log('PayPal payment captured:', capturedPayment.id);
        
        // Additional confirmation for completed capture
        break;

      case 'CHECKOUT.ORDER.APPROVED.REVERSED':
        const reversedOrder = event.resource;
        console.log('PayPal order reversed:', reversedOrder.id);
        
        // Handle order reversal/failure
        try {
          const orderId = reversedOrder.purchase_units?.[0]?.reference_id || 'unknown';
          await updateOrderPayment(orderId, {
            paymentStatus: 'failed',
            paymentMethod: 'paypal',
            paymentIntentId: reversedOrder.id
          });
          console.log('PayPal order payment status updated to failed');
        } catch (error) {
          console.error('Failed to update PayPal order payment status:', error);
        }
        
        break;

      default:
        console.log(`Unhandled PayPal event type ${event.event_type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({ 
      error: 'PayPal webhook processing failed',
      message: error.message 
    });
  }
});

// Get PayPal payment details
router.get('/paypal/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Mock PayPal order details (would use PayPal SDK in production)
    const orderDetails = {
      id: orderId,
      status: 'COMPLETED',
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: 'unknown',
        amount: {
          currency_code: 'CAD',
          value: '0.00'
        }
      }],
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString()
    };
    
    res.json(orderDetails);
  } catch (error) {
    console.error('PayPal order retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve PayPal order',
      message: error.message 
    });
  }
});

// Legacy mock routes (kept for backward compatibility)
router.post('/create-payment-intent', (req, res) => {
  res.json({ message: 'Create payment intent - implement Stripe integration' });
});

router.post('/confirm', (req, res) => {
  res.json({ message: 'Confirm payment - implement payment confirmation' });
});

router.post('/webhook', (req, res) => {
  res.json({ message: 'Stripe webhook - implement webhook handling' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Get payment ${req.params.id} - implement payment retrieval` });
});

// Initialize payments table
createPaymentsTable();

module.exports = router;
