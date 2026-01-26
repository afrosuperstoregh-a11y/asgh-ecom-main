import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Database connection (using Supabase)
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      orderId, 
      userId, 
      customerEmail, 
      lineItems, 
      successUrl, 
      cancelUrl,
      shippingRates = [],
      allowPromotionCodes = false 
    } = body;

    // Validate required fields
    if (!orderId || !lineItems || lineItems.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Order ID and line items are required'
      }, { status: 400 });
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems.map(item => ({
        price_data: {
          currency: item.currency?.toLowerCase() || 'cad',
          product_data: {
            name: item.name,
            description: item.description,
            images: item.images || []
          },
          unit_amount: Math.round(item.amount * 100), // Convert to cents
        },
        quantity: item.quantity || 1,
      })),
      mode: 'payment',
      success_url: `${successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      client_reference_id: orderId,
      customer_email: customerEmail,
      metadata: {
        orderId,
        userId: userId || 'guest',
        orderTotal: order.total.toString()
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'],
      },
      shipping_rates: shippingRates.length > 0 ? shippingRates : undefined,
      allow_promotion_codes: allowPromotionCodes,
    });

    // Update order with checkout session ID
    await supabase
      .from('orders')
      .update({
        stripeCheckoutSessionId: session.id,
        status: 'awaiting_payment',
        updatedAt: new Date()
      })
      .eq('id', orderId);

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      },
      message: 'Checkout session created successfully'
    });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to create checkout session'
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        message: 'Session ID is required'
      }, { status: 400 });
    }

    // Retrieve checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent']
    });

    return NextResponse.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Checkout session retrieval error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to retrieve checkout session'
    }, { status: 500 });
  }
}
