# Payment Integration Guide

## Overview
This document outlines the Stripe and PayPal payment integration that has been added to the Afro Superstore e-commerce platform.

## ✅ What's Been Implemented

### Backend Changes

#### 1. Environment Variables Added
- **Frontend (.env.example)**: `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- **Backend (.env.example)**: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`

#### 2. Payment API Endpoints (`/api/payments/`)

**Stripe Endpoints:**
- `POST /api/payments/stripe/create-intent` - Create PaymentIntent
- `POST /api/payments/stripe/confirm` - Confirm payment status
- `POST /api/payments/stripe/webhook` - Handle Stripe webhooks
- `GET /api/payments/stripe/:paymentIntentId` - Get payment details

**PayPal Endpoints:**
- `POST /api/payments/paypal/create-order` - Create PayPal order
- `POST /api/payments/paypal/capture-order` - Capture PayPal payment
- `POST /api/payments/paypal/webhook` - Handle PayPal webhooks
- `GET /api/payments/paypal/:orderId` - Get PayPal order details

#### 3. Order Management (`/api/orders/`)
- Enhanced order creation with payment fields
- `PATCH /api/orders/:id/payment` - Update order payment status
- Full CRUD operations for orders
- Automatic payment status updates via webhooks

#### 4. Webhook Integration
- **Stripe**: Handles `payment_intent.succeeded` and `payment_intent.payment_failed`
- **PayPal**: Handles `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, and `CHECKOUT.ORDER.APPROVED.REVERSED`

### Frontend Changes

#### 1. Enhanced CheckoutForm Component
- Payment method selection (Stripe vs PayPal)
- Stripe PaymentElement integration
- PayPal button integration (simplified version)
- Real-time payment processing
- Error handling and loading states

#### 2. Payment Flow
- User selects payment method
- Stripe: Creates PaymentIntent, shows card form
- PayPal: Creates order, processes payment
- Webhooks update order status automatically

## 🧪 Testing

### Automated Testing
Run the test script:
```bash
node test-payments.js
```

### Manual Testing

#### Stripe Testing
1. Use test card: `4242 4242 4242 4242`
2. Any future expiry date
3. Any CVC
4. Any ZIP code

#### PayPal Testing
1. Set up PayPal sandbox account
2. Use sandbox buyer credentials
3. Test in sandbox mode

#### Webhook Testing
- **Stripe**: Use Stripe CLI: `stripe listen --forward-to localhost:3001/api/payments/stripe/webhook`
- **PayPal**: Use PayPal webhook simulator in developer dashboard

## 📋 Required Environment Variables

### Production Environment Variables
```bash
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_production_client_id
PAYPAL_CLIENT_ID=your_production_client_id
PAYPAL_CLIENT_SECRET=your_production_client_secret
```

### Test Environment Variables
```bash
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
```

## 🔧 Deployment Checklist

### 1. Environment Setup
- [ ] Add all required environment variables
- [ ] Configure webhook endpoints in Stripe dashboard
- [ ] Configure webhook endpoints in PayPal developer dashboard

### 2. Database
- [ ] Ensure orders table has payment columns
- [ ] Run database migrations if needed

### 3. Frontend Dependencies
- [ ] Install Stripe React SDK: `npm install @stripe/react-stripe-js @stripe/stripe-js`
- [ ] Install PayPal React SDK: `npm install @paypal/react-paypal-js`

### 4. Backend Dependencies
- [ ] Stripe SDK already installed
- [ ] Consider adding PayPal SDK: `npm install @paypal/checkout-server-sdk`

## 🚨 Security Notes

1. **Never expose secret keys on frontend**
2. **Always verify webhook signatures**
3. **Use HTTPS in production**
4. **Validate all payment amounts server-side**
5. **Never trust frontend payment confirmations**

## 🔄 Order Status Flow

```
Order Created → Payment Initiated → Payment Processing → Payment Complete
     ↓                ↓                    ↓                  ↓
  pending      pending/processing    processing          paid/failed
```

## 📊 Payment Data Stored

### Orders Table
- `payment_status`: pending, paid, failed, refunded
- `payment_method`: stripe, paypal
- `payment_intent_id`: Transaction ID from provider

## 🛠️ Troubleshooting

### Common Issues
1. **Stripe PaymentIntent fails**: Check secret key and webhook configuration
2. **PayPal order fails**: Verify client ID and secret
3. **Webhook not updating orders**: Check webhook URL and signature verification
4. **Frontend errors**: Ensure environment variables are properly set

### Debug Mode
Set `NODE_ENV=development` for detailed error messages.

## 📞 Support

For payment integration issues:
1. Check Stripe/PayPal dashboards for error logs
2. Review server logs for webhook processing
3. Verify environment variables are correctly set
4. Test with provided test script

## 🎯 Next Steps

1. **Enhanced PayPal Integration**: Replace simplified PayPal implementation with full SDK
2. **Payment Method Icons**: Add visual payment method indicators
3. **Saved Payment Methods**: Implement customer payment method storage
4. **Subscription Support**: Add recurring payment capabilities
5. **Multi-currency**: Extend to support multiple currencies
