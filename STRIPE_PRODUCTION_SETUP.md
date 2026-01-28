# Stripe Production Setup Guide

## Overview
This guide covers setting up Stripe for complete credit card payment processing in production for Afro Superstore.

## Prerequisites
- Stripe account (https://dashboard.stripe.com)
- Business verification completed
- Access to frontend environment variables
- PCI compliance understanding

## Step 1: Stripe Account Setup

### 1.1 Create Stripe Account
1. Sign up at https://dashboard.stripe.com/register
2. Choose "Business" account type
3. Complete business verification
4. Set up bank account for payouts

### 1.2 Enable Payment Methods
In Stripe Dashboard → Settings → Payment Methods:
- ✅ **Card payments** - Enable all card brands
- ✅ **Apple Pay** - For mobile users
- ✅ **Google Pay** - For Android users
- ✅ **Link** - Stripe's payment method aggregator

### 1.3 Configure Security Settings
- **Radar for fraud** - Enable basic fraud detection
- **3D Secure** - Enable for high-value transactions
- **SCA compliance** - Ensure European compliance
- **Webhooks** - Configure for payment events

## Step 2: API Keys Configuration

### 2.1 Get API Keys
In Stripe Dashboard → Developers → API keys:
- **Publishable Key** - For frontend (pk_live_...)
- **Secret Key** - For backend (sk_live_...)
- **Webhook Secret** - For webhook verification

### 2.2 Environment Variables
Add these to your environment files:

#### Development (.env.local)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

#### Production (Vercel)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

#### Railway (Backend)
```bash
STRIPE_SECRET_KEY=sk_live_...
```

## Step 3: Frontend Integration

### 3.1 Stripe Packages
```bash
npm install @stripe/react-stripe-js @stripe/stripe-js stripe
```

### 3.2 Stripe Components
The integration includes:

#### StripePayment Component
- **CardElement** - Secure card input form
- **PaymentIntent** - Create and confirm payments
- **Error handling** - Comprehensive error states
- **Loading states** - Professional UX indicators
- **Security badges** - Trust indicators

#### PaymentMethodSelector Integration
- **Card/PayPal toggle** - Seamless switching
- **Real-time validation** - Card number and expiry checks
- **Visual feedback** - Clear payment method indicators
- **Mobile responsive** - Works on all devices

### 3.3 Payment Flow
1. Customer selects "Credit/Debit Card"
2. Stripe Elements renders secure card form
3. Customer enters card details
4. Frontend creates PaymentIntent via API
5. Stripe confirms payment with 3D Secure if needed
6. Payment processed and order confirmed
7. Receipt email sent to customer

## Step 4: Backend Integration

### 4.1 Payment Intent API
`/api/stripe/create-payment-intent`:
- Creates PaymentIntent with amount and currency
- Handles 3D Secure requirements
- Includes metadata for tracking
- Returns client secret for frontend

### 4.2 Webhook Handlers
Create webhook endpoints for:
- **payment_intent.succeeded** - Order fulfillment
- **payment_intent.payment_failed** - Error handling
- **charge.dispute.created** - Dispute management
- **customer.subscription.deleted** - Subscription cleanup

### 4.3 Order Processing
- Validate payment amounts server-side
- Create orders only after successful payment
- Handle partial payments and refunds
- Update inventory and shipping status

## Step 5: Security & Compliance

### 5.1 PCI Compliance
- ✅ **Stripe Elements** - Never touches raw card data
- ✅ **HTTPS only** - All payments over secure connections
- ✅ **No card storage** - Stripe handles all sensitive data
- ✅ **Tokenization** - Card details replaced with tokens

### 5.2 Fraud Prevention
- **Stripe Radar** - Basic fraud detection
- **3D Secure** - For high-value transactions
- **Velocity limits** - Prevent rapid transactions
- **Address verification** - AVS checks

### 5.3 Data Protection
- **Minimal data collection** - Only necessary information
- **Secure storage** - Encrypt all sensitive data
- **Access controls** - Limit payment data access
- **Audit logs** - Track all payment activities

## Step 6: Testing

### 6.1 Stripe Test Cards
Use these test cards in development:
- **Visa**: 4242 4242 4242 4242
- **Mastercard**: 5555 5555 5555 4444
- **Amex**: 3782 822463 10005
- **Declined**: 4000 0000 0000 0002

### 6.2 Test Scenarios
- ✅ Successful card payment
- ✅ 3D Secure authentication
- ✅ Declined card payments
- ✅ Insufficient funds
- ✅ Expired cards
- ✅ Invalid CVV

### 6.3 3D Secure Testing
- **Trigger 3D Secure**: Use 4000 0025 0000 3155
- **Successful 3D Secure**: Use test code 123456
- **Failed 3D Secure**: Use test code 000000

## Step 7: Production Deployment

### 7.1 Live Mode Setup
1. Switch to live API keys
2. Update environment variables
3. Test with real cards (small amounts)
4. Monitor Stripe dashboard
5. Set up webhook endpoints

### 7.2 Monitoring
Monitor in Stripe Dashboard:
- **Payment volume** - Track transaction amounts
- **Success rates** - Monitor payment acceptance
- **Disputes** - Handle chargebacks quickly
- **Fraud signals** - Review suspicious activity

### 7.3 Performance Optimization
- **PaymentIntent reuse** - For saved cards
- **Radar rules** - Fine-tune fraud detection
- **Webhook reliability** - Ensure webhook delivery
- **Error handling** - Graceful failure recovery

## Step 8: Advanced Features

### 8.1 Saved Cards
```javascript
// Save payment method for future use
const { error, paymentMethod } = await stripe.createPaymentMethod({
  type: 'card',
  card: elements.getElement(CardElement),
  billing_details: {
    email: customer.email,
    name: customer.name,
  },
});
```

### 8.2 Subscriptions
```javascript
// Create subscription
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent'],
});
```

### 8.3 Apple Pay / Google Pay
```javascript
// Enable digital wallets
const paymentRequest = stripe.paymentRequest({
  country: 'US',
  currency: 'usd',
  total: {
    label: 'Afro Superstore',
    amount: amount * 100,
  },
  requestPayerName: true,
  requestPayerEmail: true,
});
```

## Step 9: Troubleshooting

### 9.1 Common Issues

#### Issue: Card payments failing
**Solutions:**
- Check API keys are correct
- Verify card details are valid
- Check 3D Secure requirements
- Review Radar fraud rules

#### Issue: PaymentIntent creation failing
**Solutions:**
- Verify secret key is correct
- Check amount format (in cents)
- Review currency codes
- Check webhook configuration

#### Issue: Webhooks not receiving
**Solutions:**
- Verify webhook endpoint URL
- Check webhook secret
- Review server logs
- Test with Stripe CLI

### 9.2 Debug Mode
Enable Stripe logging:
```javascript
// In development
const stripe = loadStripe(pk_test_key, {
  apiVersion: '2025-12-15.clover',
  stripeAccount: 'acct_...',
});
```

## Step 10: Compliance & Legal

### 10.1 Required Disclosures
- **Privacy Policy** - How payment data is handled
- **Terms of Service** - Payment processing terms
- **Refund Policy** - Clear refund procedures
- **Contact Information** - Support for payment issues

### 10.2 Regulatory Compliance
- **PCI DSS** - Payment card industry standards
- **GDPR** - European data protection
- **CCPA** - California privacy rights
- **PSD2** - European payment services

## Testing Checklist

- [ ] Stripe account created and verified
- [ ] API keys obtained and configured
- [ ] Payment methods enabled
- [ ] Frontend components integrated
- [ ] Backend API endpoints created
- [ ] Test cards working
- [ ] 3D Secure testing completed
- [ ] Error handling tested
- [ ] Webhook endpoints configured
- [ ] Production deployment ready
- [ ] Live testing with small amounts
- [ ] Monitoring and alerts set up

## Security Checklist

- [ ] HTTPS enabled everywhere
- [ ] API keys stored securely
- [ ] No raw card data stored
- [ ] PCI compliance maintained
- [ ] Fraud detection enabled
- [ ] Webhook signatures verified
- [ ] Access controls implemented
- [ ] Audit logging enabled
- [ ] Data encryption enabled
- [ ] Regular security reviews

## Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **React Stripe SDK**: https://github.com/stripe/react-stripe-js
- **Stripe CLI**: https://stripe.com/docs/stripe-cli

## Next Steps

1. Complete Stripe account setup
2. Configure API keys and environment variables
3. Install and integrate Stripe components
4. Test thoroughly with test cards
5. Set up webhooks and monitoring
6. Deploy to production
7. Monitor and optimize

This setup provides complete, secure credit card payment processing with Stripe in production!
