import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_dummy') {
      return NextResponse.json(
        { error: 'Stripe is not properly configured' },
        { status: 500 }
      );
    }

    const { amount, currency = 'usd', metadata = {} } = await request.json();

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...metadata,
        source: 'afro-superstore-website',
      },
    });

    // Return the clientSecret to the frontend
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Stripe PaymentIntent creation error:', error);
    
    if (error && typeof error === 'object' && 'type' in error && error.type === 'StripeError') {
      return NextResponse.json(
        { error: (error as any).message },
        { status: (error as any).statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
