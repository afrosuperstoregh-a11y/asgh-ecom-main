import { NextResponse } from 'next/server';
import Stripe from 'stripe';
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

export async function GET(request) {
  try {
    // Check if Supabase is available
    if (!supabase) {
      return NextResponse.json({
        success: false,
        message: 'Database connection not available'
      }, { status: 500 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status');
    
    // Build query
    let query = supabase
      .from('payments')
      .select(`
        *,
        orders(id, orderNumber, total, userId),
        users(id, name, email)
      `)
      .order('createdAt', { ascending: false });
    
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data: payments, error, count } = await query;
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch payments'
      }, { status: 500 });
    }
    
    // Format payments to match expected structure
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      amount: parseFloat(payment.amount),
      currency: payment.currency,
      status: payment.status.toUpperCase(),
      provider: 'stripe',
      providerId: payment.stripePaymentIntentId,
      createdAt: payment.createdAt,
      order: {
        id: payment.orderId,
        orderNumber: payment.orders?.orderNumber || `ORD-${payment.orderId.slice(-8)}`,
        total: parseFloat(payment.orders?.total || payment.amount),
        user: payment.users ? {
          name: payment.users.name,
          email: payment.users.email
        } : null
      },
      paymentMethod: {
        type: payment.paymentMethodType,
        last4: payment.paymentMethodDetails?.card?.last4,
        brand: payment.paymentMethodDetails?.card?.brand
      },
      refunds: payment.refundAmount ? [{
        id: `REF-${payment.id}`,
        amount: payment.refundAmount,
        status: 'COMPLETED',
        createdAt: payment.refundedAt
      }] : []
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: {
          page,
          limit,
          total: count || formattedPayments.length,
          totalPages: Math.ceil((count || formattedPayments.length) / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Payments fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch payments'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Check if Supabase is available
    if (!supabase) {
      return NextResponse.json({
        success: false,
        message: 'Database connection not available'
      }, { status: 500 });
    }

    const body = await request.json();
    const { amount, currency = 'cad', orderId, userId, paymentMethodId } = body;
    
    // Validate required fields
    if (!amount || !orderId) {
      return NextResponse.json({
        success: false,
        message: 'Amount and Order ID are required'
      }, { status: 400 });
    }
    
    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        orderId,
        userId: userId || 'guest'
      },
      automatic_payment_methods: {
        enabled: true,
      },
      ...(paymentMethodId && { payment_method: paymentMethodId }),
    });
    
    // Create payment record in database
    const { data: payment, error: dbError } = await supabase
      .from('payments')
      .insert({
        orderId,
        userId: userId || null,
        amount: amount,
        currency: currency.toUpperCase(),
        status: 'pending',
        paymentMethodType: 'card',
        stripePaymentIntentId: paymentIntent.id,
        metadata: {
          stripeClientSecret: paymentIntent.client_secret
        }
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database error:', dbError);
      // Try to rollback Stripe payment intent
      await stripe.paymentIntents.cancel(paymentIntent.id);
      
      return NextResponse.json({
        success: false,
        message: 'Failed to create payment record'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: payment.id,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: currency.toUpperCase(),
        status: 'pending'
      },
      message: 'Payment intent created successfully'
    });
    
  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to process payment'
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    // Check if Supabase is available
    if (!supabase) {
      return NextResponse.json({
        success: false,
        message: 'Database connection not available'
      }, { status: 500 });
    }

    const body = await request.json();
    const { id, status, refundAmount } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Payment ID is required'
      }, { status: 400 });
    }
    
    // Get payment record
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !payment) {
      return NextResponse.json({
        success: false,
        message: 'Payment not found'
      }, { status: 404 });
    }
    
    let updatedPayment = { ...payment };
    
    // Handle different status updates
    switch (status) {
      case 'succeeded':
        updatedPayment.status = 'succeeded';
        updatedPayment.paidAt = new Date();
        break;
        
      case 'failed':
        updatedPayment.status = 'failed';
        updatedPayment.failedAt = new Date();
        // Cancel the Stripe payment intent
        if (payment.stripePaymentIntentId) {
          await stripe.paymentIntents.cancel(payment.stripePaymentIntentId);
        }
        break;
        
      case 'refunded':
        if (payment.stripeChargeId) {
          // Create refund in Stripe
          const refund = await stripe.refunds.create({
            charge: payment.stripeChargeId,
            amount: refundAmount ? Math.round(refundAmount * 100) : undefined,
          });
          
          updatedPayment.status = 'refunded';
          updatedPayment.refundedAt = new Date();
          updatedPayment.refundAmount = refundAmount || payment.amount;
          updatedPayment.metadata = {
            ...payment.metadata,
            refundId: refund.id
          };
        } else {
          return NextResponse.json({
            success: false,
            message: 'No charge ID available for refund'
          }, { status: 400 });
        }
        break;
        
      case 'canceled':
        updatedPayment.status = 'canceled';
        updatedPayment.canceledAt = new Date();
        // Cancel the Stripe payment intent
        if (payment.stripePaymentIntentId) {
          await stripe.paymentIntents.cancel(payment.stripePaymentIntentId);
        }
        break;
        
      default:
        updatedPayment.status = status;
    }
    
    // Update payment in database
    const { data: updated, error: updateError } = await supabase
      .from('payments')
      .update({
        status: updatedPayment.status,
        paidAt: updatedPayment.paidAt,
        failedAt: updatedPayment.failedAt,
        refundedAt: updatedPayment.refundedAt,
        refundAmount: updatedPayment.refundAmount,
        canceledAt: updatedPayment.canceledAt,
        metadata: updatedPayment.metadata,
        updatedAt: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({
        success: false,
        message: 'Failed to update payment'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: updated,
      message: `Payment ${status} successfully`
    });
    
  } catch (error) {
    console.error('Payment update error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to update payment'
    }, { status: 500 });
  }
}
