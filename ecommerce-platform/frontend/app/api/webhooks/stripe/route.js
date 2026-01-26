import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Database connection (using Supabase)
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;
      
      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object);
        break;
      
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;
      
      case 'charge.failed':
        await handleChargeFailed(event.data.object);
        break;
      
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  const userId = paymentIntent.metadata.userId;

  if (!orderId) {
    console.error('No order ID found in payment intent metadata');
    return;
  }

  // Update payment record
  const { error: paymentError } = await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      paidAt: new Date(),
      metadata: {
        ...paymentIntent.metadata,
        paymentMethodDetails: paymentIntent.payment_method
      }
    })
    .eq('stripePaymentIntentId', paymentIntent.id);

  if (paymentError) {
    console.error('Error updating payment:', paymentError);
    return;
  }

  // Update order status
  const { error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      updatedAt: new Date()
    })
    .eq('id', orderId);

  if (orderError) {
    console.error('Error updating order:', orderError);
  }

  console.log(`Payment succeeded for order ${orderId}`);
}

async function handlePaymentIntentFailed(paymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    console.error('No order ID found in payment intent metadata');
    return;
  }

  // Update payment record
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      failedAt: new Date(),
      error: paymentIntent.last_payment_error?.message || 'Payment failed'
    })
    .eq('stripePaymentIntentId', paymentIntent.id);

  if (error) {
    console.error('Error updating payment:', error);
  }

  console.log(`Payment failed for order ${orderId}`);
}

async function handlePaymentIntentCanceled(paymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    console.error('No order ID found in payment intent metadata');
    return;
  }

  // Update payment record
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'canceled',
      canceledAt: new Date(),
      error: paymentIntent.cancellation_reason || 'Payment was canceled'
    })
    .eq('stripePaymentIntentId', paymentIntent.id);

  if (error) {
    console.error('Error updating payment:', error);
  }

  console.log(`Payment canceled for order ${orderId}`);
}

async function handleChargeSucceeded(charge) {
  const paymentIntentId = charge.payment_intent;

  if (!paymentIntentId) {
    console.error('No payment intent ID found in charge');
    return;
  }

  // Update payment record with charge details
  const { error } = await supabase
    .from('payments')
    .update({
      stripeChargeId: charge.id,
      receiptUrl: charge.receipt_url,
      paymentMethodDetails: {
        ...charge.payment_method_details,
        card: {
          last4: charge.payment_method_details?.card?.last4,
          brand: charge.payment_method_details?.card?.brand,
          exp_month: charge.payment_method_details?.card?.exp_month,
          exp_year: charge.payment_method_details?.card?.exp_year
        }
      }
    })
    .eq('stripePaymentIntentId', paymentIntentId);

  if (error) {
    console.error('Error updating payment with charge details:', error);
  }

  console.log(`Charge succeeded: ${charge.id}`);
}

async function handleChargeRefunded(charge) {
  const paymentIntentId = charge.payment_intent;

  if (!paymentIntentId) {
    console.error('No payment intent ID found in charge');
    return;
  }

  // Update payment record
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'refunded',
      refundedAt: new Date(),
      refundAmount: (charge.amount_refunded || 0) / 100, // Convert from cents
      metadata: {
        refundId: charge.refunds?.data?.[0]?.id,
        refundReason: charge.refunds?.data?.[0]?.reason
      }
    })
    .eq('stripePaymentIntentId', paymentIntentId);

  if (error) {
    console.error('Error updating payment refund:', error);
    return;
  }

  // Get the payment record to find the order ID
  const { data: payment } = await supabase
    .from('payments')
    .select('orderId')
    .eq('stripePaymentIntentId', paymentIntentId)
    .single();

  if (payment?.orderId) {
    // Update order status
    await supabase
      .from('orders')
      .update({
        status: 'refunded',
        updatedAt: new Date()
      })
      .eq('id', payment.orderId);
  }

  console.log(`Charge refunded: ${charge.id}`);
}

async function handleChargeFailed(charge) {
  const paymentIntentId = charge.payment_intent;

  if (!paymentIntentId) {
    console.error('No payment intent ID found in charge');
    return;
  }

  // Update payment record
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      failedAt: new Date(),
      error: charge.failure_message || 'Charge failed'
    })
    .eq('stripeChargeId', charge.id);

  if (error) {
    console.error('Error updating payment charge failure:', error);
  }

  console.log(`Charge failed: ${charge.id}`);
}

async function handleCheckoutSessionCompleted(session) {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    console.error('No order ID found in checkout session metadata');
    return;
  }

  // Update order status to processing
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'processing',
      updatedAt: new Date()
    })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order after checkout session:', error);
  }

  console.log(`Checkout session completed for order ${orderId}`);
}
