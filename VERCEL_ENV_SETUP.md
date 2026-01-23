# Vercel Environment Variables Setup

## Step-by-Step Guide

### 1. Go to Vercel Dashboard
1. Log in to [vercel.com](https://vercel.com)
2. Select your project
3. Go to Settings → Environment Variables

### 2. Add Required Variables

#### Core Application
```
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-super-secret-key-here
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app/api
```

#### Database
```
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://user:password@host:6379
```

#### Authentication
```
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-jwt-refresh-secret-here
```

#### Payment (Stripe)
```
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_CURRENCY=cad
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

#### Email (SendGrid)
```
SENDGRID_API_KEY=SG.your_sendgrid_api_key
FROM_EMAIL=noreply@your-domain.com
FROM_NAME=Your Store Name
```

#### OAuth
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
```

#### Security
```
CORS_ORIGIN=https://your-domain.vercel.app
BCRYPT_ROUNDS=12
```

### 3. Environment Types
- **Production**: For live deployment
- **Preview**: For pull request previews
- **Development**: For local development

### 4. Secret Variables
Mark these as "Secret" in Vercel:
- All API keys
- Database passwords
- JWT secrets
- Webhook secrets

### 5. Verification
1. After adding variables, redeploy your application
2. Check deployment logs for any missing variables
3. Test core functionality (login, checkout, etc.)

## Common Issues
- Missing variables cause build failures
- Incorrect URLs break OAuth and webhooks
- Database connection strings must include SSL mode
