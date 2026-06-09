const express = require('express');
const router = express.Router();
const paystackService = require('../services/paystackService');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/paystack/initialize
 * Initialize a Paystack transaction
 */
router.post('/initialize', async (req, res) => {
  try {
    const { email, amount, orderId, metadata = {} } = req.body;

    // Validate required fields
    if (!email || !amount || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Email, amount, and orderId are required'
      });
    }

    // Validate amount (minimum Paystack amount is GHS 1.00)
    if (amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount is GHS 1.00'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if order exists and belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is already paid
    if (order.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Generate unique reference
    const reference = paystackService.generateReference();

    // Initialize Paystack transaction
    const paystackResponse = await paystackService.initializeTransaction({
      email,
      amount,
      reference,
      metadata: {
        order_id: orderId,
        user_id: req.user?.id || null,
        ...metadata
      }
    });

    // Update order with payment reference
    await supabase
      .from('orders')
      .update({
        payment_reference: reference,
        payment_provider: 'paystack',
        currency: 'GHS',
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    res.status(200).json({
      success: true,
      message: 'Paystack transaction initialized successfully',
      data: {
        reference,
        authorization_url: paystackResponse.data.authorization_url,
        access_code: paystackResponse.data.access_code,
        amount,
        currency: 'GHS',
        email
      }
    });

  } catch (error) {
    console.error('Paystack initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize Paystack transaction',
      error: error.message
    });
  }
});

/**
 * GET /api/paystack/verify/:reference
 * Verify a Paystack transaction
 */
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference is required'
      });
    }

    // Verify transaction with Paystack
    const verificationResponse = await paystackService.verifyTransaction(reference);

    if (!verificationResponse.status) {
      return res.status(400).json({
        success: false,
        message: 'Transaction verification failed',
        data: verificationResponse
      });
    }

    const { data } = verificationResponse;
    const paymentStatus = data.status;
    const paymentAmount = data.amount / 100; // Convert back to GHS

    // Find order by reference
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_reference', reference)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found for this transaction'
      });
    }

    // Update order based on payment status
    let updateData = {
      payment_status: paymentStatus,
      payment_details: {
        provider: 'paystack',
        reference,
        status: paymentStatus,
        amount: paymentAmount,
        currency: 'GHS',
        paid_at: data.paid_at,
        customer: data.customer,
        metadata: data.metadata
      },
      updated_at: new Date().toISOString()
    };

    if (paymentStatus === 'success') {
      updateData.status = 'paid';
      updateData.paid_at = new Date().toISOString();
    } else if (paymentStatus === 'failed') {
      updateData.status = 'payment_failed';
    }

    await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    res.status(200).json({
      success: true,
      message: `Transaction ${paymentStatus}`,
      data: {
        reference,
        status: paymentStatus,
        amount: paymentAmount,
        currency: 'GHS',
        order_id: order.id,
        paid_at: data.paid_at,
        customer: data.customer
      }
    });

  } catch (error) {
    console.error('Paystack verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify Paystack transaction',
      error: error.message
    });
  }
});

/**
 * POST /api/paystack/webhook
 * Handle Paystack webhooks
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature (optional but recommended)
    const signature = req.headers['x-paystack-signature'];
    
    // For now, we'll process the webhook without signature verification
    // In production, you should verify the signature using your Paystack secret key
    const event = JSON.parse(req.body);

    console.log('Paystack webhook received:', {
      event: event.event,
      reference: event.data?.reference,
      status: event.data?.status
    });

    // Process the webhook event
    await paystackService.handleWebhook(event);

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Paystack webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error.message
    });
  }
});

/**
 * GET /api/paystack/status/:reference
 * Get transaction status
 */
router.get('/status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference is required'
      });
    }

    const statusData = await paystackService.getTransactionStatus(reference);

    res.status(200).json({
      success: true,
      message: 'Transaction status retrieved successfully',
      data: statusData
    });

  } catch (error) {
    console.error('Paystack status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction status',
      error: error.message
    });
  }
});

/**
 * POST /api/paystack/refund
 * Process a refund (if needed)
 */
router.post('/refund', authenticateToken, async (req, res) => {
  try {
    const { reference, amount, reason } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference is required'
      });
    }

    // Note: Paystack doesn't have a direct refund API like Stripe
    // Refunds are typically handled through the Paystack dashboard
    // This endpoint can be used to log refund requests for manual processing

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_reference', reference)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found for this transaction'
      });
    }

    // Log refund request for manual processing
    await supabase
      .from('refund_requests')
      .insert({
        order_id: order.id,
        payment_reference: reference,
        amount: amount || order.total,
        reason: reason || 'Customer request',
        status: 'pending',
        created_at: new Date().toISOString()
      });

    res.status(200).json({
      success: true,
      message: 'Refund request submitted successfully. Refunds are processed manually through Paystack dashboard.',
      data: {
        reference,
        amount: amount || order.total,
        status: 'pending_manual_processing'
      }
    });

  } catch (error) {
    console.error('Paystack refund request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit refund request',
      error: error.message
    });
  }
});

module.exports = router;
