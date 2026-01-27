# Stripe Production Setup Checklist

## ✅ Completed Tasks
- [x] Fixed Stripe API version inconsistencies across all services
- [x] Added missing environment variables to Vercel configuration
- [x] Verified webhook endpoint implementation
- [x] Confirmed payment flow architecture

## 🔧 Required Actions for Production

### 1. Update Production Environment Variables
Replace placeholder values in `.env.production`:

```bash
# Current placeholders - REPLACE THESE:
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_STRIPE_WEBHOOK_SECRET_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE

# Replace with actual live keys from Stripe Dashboard
```

### 2. Configure Stripe Webhooks
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://afro-pied.vercel.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.succeeded`
   - `charge.refunded`
   - `charge.failed`
4. Copy webhook signing secret to environment variables

### 3. Vercel Environment Variables
Set these in Vercel Dashboard:
- `stripe_secret_key`: Your live secret key
- `stripe_publishable_key`: Your live publishable key
- `stripe_webhook_secret`: Your webhook signing secret

### 4. Test Production Flow
1. Switch Stripe account to live mode
2. Test with real payment (small amount like $1.00)
3. Verify webhook events are received
4. Check database updates for orders and payments

## 🚨 Critical Notes

### API Version Consistency
All services now use `2023-10-16`:
- Backend NestJS service
- Frontend API routes
- Webhook handlers

### Webhook Endpoint
- Correct endpoint: `/api/webhooks/stripe`
- Implemented in: `ecommerce-platform/frontend/app/api/webhooks/stripe/route.js`
- Handles all essential payment events

### Payment Flow Architecture
1. Frontend creates payment intent via `/api/stripe`
2. User completes payment with Stripe Elements
3. Stripe sends webhook events to `/api/webhooks/stripe`
4. Webhook handler updates database (orders/payments)
5. Frontend receives payment confirmation

## 📋 Environment Variable Reference

### Required Stripe Variables
```bash
STRIPE_SECRET_KEY=sk_live_...          # Server-side use
STRIPE_PUBLISHABLE_KEY=pk_live_...      # Server-side use
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Client-side use
STRIPE_WEBHOOK_SECRET=whsec_...         # Webhook verification
```

### Optional Configuration
```bash
STRIPE_CURRENCY=cad                    # Currency code
STRIPE_SUCCESS_URL=https://domain.com/checkout/success
STRIPE_CANCEL_URL=https://domain.com/cart
```

## 🔍 Verification Steps

1. **Environment Check**: Ensure no placeholder values remain
2. **Webhook Test**: Use Stripe CLI to test webhooks locally
3. **Payment Test**: Process a test payment in live mode
4. **Database Check**: Verify orders/payments are updated correctly
5. **Error Handling**: Test failed payment scenarios

## 📞 Support

If issues arise:
1. Check Stripe Dashboard logs
2. Review Vercel function logs
3. Verify webhook endpoint accessibility
4. Confirm API key permissions
