# PayPal Integration Setup Guide

## Overview
This guide covers setting up PayPal as a payment option for the Afro Superstore checkout.

## Prerequisites
- PayPal Business account (https://www.paypal.com/business)
- PayPal Developer account (https://developer.paypal.com)
- Access to frontend environment variables

## Step 1: PayPal Developer Setup

### 1.1 Create PayPal Developer Account
1. Go to https://developer.paypal.com
2. Sign up or log in with your PayPal account
3. Navigate to Dashboard → Applications

### 1.2 Create Application
1. Click "Create App"
2. Select "Merchant" as app type
3. Name your app (e.g., "Afro Superstore")
4. Select "Accept payments" capability
5. Choose "Sandbox" for testing, "Live" for production

### 1.3 Get API Credentials
After creating the app, you'll get:
- **Client ID**: Required for frontend integration
- **Client Secret**: Required for backend (if needed)

## Step 2: Environment Configuration

### 2.1 Frontend Environment Variables
Add these to your environment files:

#### Development (.env.local)
```bash
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id_here
NEXT_PUBLIC_PAYPAL_ENVIRONMENT=sandbox
```

#### Production (Vercel)
```bash
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_live_client_id_here
NEXT_PUBLIC_PAYPAL_ENVIRONMENT=live
```

### 2.2 PayPal Configuration Options
The PayPal integration supports these options:
- **Sandbox Mode**: Testing with fake money
- **Live Mode**: Real transactions
- **Currency**: USD (default), CAD, EUR, etc.
- **Funding Sources**: PayPal, credit cards, etc.

## Step 3: Frontend Integration

### 3.1 PayPal Package Installation
```bash
npm install @paypal/react-paypal-js
```

### 3.2 PayPal Components
The integration includes:

#### PayPalPayment Component
- Renders PayPal buttons
- Handles payment flow
- Manages success/error states
- Supports multiple currencies

#### PaymentMethodSelector Component
- Allows switching between Card and PayPal
- Shows payment method options
- Handles payment method changes
- Integrates with checkout flow

### 3.3 Payment Flow
1. Customer selects PayPal as payment method
2. PayPal buttons render and load
3. Customer clicks PayPal button
4. PayPal popup opens for authentication
5. Customer approves payment
6. PayPal returns payment details
7. Order is processed and confirmed

## Step 4: Testing

### 4.1 Sandbox Testing
1. Use PayPal sandbox credentials
2. Test with sandbox buyer accounts
3. Verify payment flow works end-to-end
4. Check order confirmation emails

### 4.2 Test Scenarios
- ✅ Successful PayPal payment
- ✅ Cancelled PayPal payment
- ✅ PayPal payment errors
- ✅ Switching between payment methods
- ✅ Order confirmation after PayPal payment

### 4.3 Sandbox Buyer Accounts
Use these PayPal sandbox accounts for testing:
- **Personal Account**: personal@example.com / password
- **Business Account**: business@example.com / password

## Step 5: Production Deployment

### 5.1 Live PayPal Setup
1. Switch to live PayPal credentials
2. Update environment variables
3. Test with small amounts first
4. Monitor transactions in PayPal dashboard

### 5.2 Security Considerations
- Never expose client secret in frontend
- Use HTTPS for all PayPal transactions
- Validate payment amounts server-side
- Monitor for suspicious activity

## Step 6: PayPal Dashboard Monitoring

### 6.1 Transaction Monitoring
Monitor in PayPal Business Dashboard:
- Transaction volume
- Success rates
- Disputes and chargebacks
- Payment methods used

### 6.2 Analytics
Track these metrics:
- PayPal vs credit card usage
- Conversion rates by payment method
- Average order value by payment method
- Payment method abandonment

## Step 7: Troubleshooting

### 7.1 Common Issues

#### Issue: PayPal buttons not loading
**Solutions:**
- Check NEXT_PUBLIC_PAYPAL_CLIENT_ID is set
- Verify environment (sandbox/live)
- Check browser console for errors
- Ensure internet connectivity

#### Issue: PayPal popup blocked
**Solutions:**
- Check browser popup blocker settings
- Ensure HTTPS in production
- Test in different browsers

#### Issue: Payment not completing
**Solutions:**
- Verify PayPal account status
- Check funding source availability
- Review PayPal error messages
- Test with different accounts

#### Issue: Order not created after PayPal payment
**Solutions:**
- Check backend API endpoints
- Verify payment data processing
- Review server logs
- Test payment success callback

### 7.2 Debug Mode
Enable debug logging:
```javascript
// In PayPalPayment component
console.log('PayPal Debug:', { clientId, environment, amount });
```

## Step 8: Advanced Features

### 8.1 Multiple Currencies
Configure for different currencies:
```javascript
const paypalOptions = {
  'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  currency: 'CAD', // or USD, EUR, etc.
  intent: 'capture'
};
```

### 8.2 Custom Styling
Customize PayPal button appearance:
```javascript
style={{
  layout: 'vertical',
  color: 'gold',
  shape: 'rect',
  label: 'pay',
  height: 48
}}
```

### 8.3 Subscription Support
For recurring payments:
```javascript
createSubscription: (data, actions) => {
  return actions.subscription.create({
    'plan_id': 'YOUR_PLAN_ID'
  });
}
```

## Step 9: Compliance

### 9.1 PayPal Agreement
Ensure compliance with:
- PayPal Acceptable Use Policy
- User Agreement
- Privacy Policy
- Payment Card Industry (PCI) standards

### 9.2 Data Protection
- Store only necessary payment data
- Use secure transmission (HTTPS)
- Implement proper data retention
- Follow GDPR/CCPA requirements

## Testing Checklist

- [ ] PayPal developer account created
- [ ] Application created and configured
- [ ] Client ID obtained
- [ ] Environment variables set
- [ ] PayPal package installed
- [ ] Components integrated
- [ ] Sandbox testing completed
- [ ] Payment flow verified
- [ ] Error handling tested
- [ ] Production deployment ready
- [ ] Live testing with small amounts
- [ ] Monitoring configured

## Support Resources

- **PayPal Developer Docs**: https://developer.paypal.com/docs
- **PayPal React SDK**: https://github.com/paypal/react-paypal-js
- **PayPal Support**: https://www.paypal.com/support
- **Community Forum**: https://www.paypal-community.com

## Next Steps

1. Complete PayPal developer setup
2. Configure environment variables
3. Install and integrate PayPal components
4. Test thoroughly in sandbox
5. Deploy to production
6. Monitor and optimize

This setup provides customers with PayPal as a secure, trusted payment option alongside credit cards at checkout!
