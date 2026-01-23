# Stripe Setup Guide for Vercel Deployment

## 1. Create Stripe Account
1. Go to [stripe.com](https://stripe.com)
2. Create account or sign in
3. Complete business verification

## 2. Get API Keys
1. Go to Developers → API keys
2. Copy **Live** keys (not test keys):
   - Publishable key: `pk_live_...`
   - Secret key: `sk_live_...`

## 3. Configure Webhooks
1. Go to Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select these events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret: `whsec_...`

## 4. Update Environment Variables
```bash
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_CURRENCY=cad
```

## 5. Test Payments
- Use Stripe's test cards for initial testing
- Enable test mode in Stripe dashboard
- Switch to live mode for production
