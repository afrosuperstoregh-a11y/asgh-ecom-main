# Afro Superstore E-commerce Platform - Production Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying the Afro Superstore e-commerce platform to production using Vercel (frontend) and Supabase (backend/database).

## Architecture
- **Frontend**: Next.js 16 deployed on Vercel
- **Backend**: Node.js/Express API (optional - can be serverless)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe + Paystack
- **Storage**: Cloudinary + Supabase Storage
- **Monitoring**: Vercel Analytics + Google Analytics

## Prerequisites

### Required Accounts
- [Vercel Account](https://vercel.com)
- [Supabase Account](https://supabase.com)
- [Stripe Account](https://stripe.com)
- [Paystack Account](https://paystack.co)
- [Cloudinary Account](https://cloudinary.com)
- [SendGrid Account](https://sendgrid.com)

### Required Tools
- Node.js 20+
- Git
- Supabase CLI (optional but recommended)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and region
4. Set database password (save securely)
5. Wait for project creation

### 1.2 Run Database Migrations
1. Go to Supabase SQL Editor
2. Run migration files in order:
   ```sql
   -- Run: database/migrations/001_initial_schema_postgresql.sql
   -- Then: database/migrations/002_supabase_rls_policies.sql
   ```

### 1.3 Configure Supabase Auth
1. Go to Authentication > Settings
2. Configure site URL: `https://www.afrosuperstore.ca`
3. Add redirect URLs:
   - `https://www.afrosuperstore.ca/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

### 1.4 Get Supabase Credentials
From Supabase Project Settings > API:
- Project URL
- Anon Key
- Service Role Key

## Step 2: Environment Configuration

### 2.1 Backend Environment Variables
Create `.env` file in backend directory:
```bash
# Copy from backend/.env.example and fill in actual values
cp backend/.env.example backend/.env
```

**Critical Variables to Set:**
```bash
NODE_ENV=production
PORT=3001
HOSTNAME=0.0.0.0

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Payment Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key

# Email Configuration
SENDGRID_API_KEY=SG.your_actual_sendgrid_key
FROM_EMAIL=noreply@afrosuperstore.ca

# Security
SESSION_SECRET=your_strong_32_character_secret
ENCRYPTION_KEY=your_encryption_key
```

### 2.2 Frontend Environment Variables
Create `.env.local` file in frontend directory:
```bash
# Copy from frontend/.env.example and fill in actual values
cp frontend/.env.example frontend/.env.local
```

**Critical Variables to Set:**
```bash
NEXT_PUBLIC_SITE_URL=https://www.afrosuperstore.ca
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_key
```

## Step 3: Payment Setup

### 3.1 Stripe Configuration
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get API keys (use live keys for production)
3. Configure webhook endpoint: `https://api.afrosuperstore.ca/api/webhooks/stripe`
4. Enable webhook events:
   - checkout.session.completed
   - payment_intent.succeeded
   - payment_intent.payment_failed

### 3.2 Paystack Configuration
1. Go to [Paystack Dashboard](https://dashboard.paystack.co)
2. Get API keys (use live keys for production)
3. Configure webhook URL: `https://api.afrosuperstore.ca/api/webhooks/paystack`

## Step 4: Frontend Deployment (Vercel)

### 4.1 Install Vercel CLI
```bash
npm i -g vercel
```

### 4.2 Deploy Frontend
```bash
cd frontend
vercel --prod
```

### 4.3 Configure Vercel Environment Variables
In Vercel Dashboard > Project Settings > Environment Variables:
```bash
NEXT_PUBLIC_SITE_URL=https://www.afrosuperstore.ca
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_key
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
```

### 4.4 Configure Custom Domain
1. In Vercel project settings, add custom domain: `www.afrosuperstore.ca`
2. Update DNS records as instructed by Vercel
3. Wait for SSL certificate issuance

## Step 5: Backend Deployment Options

### Option A: Serverless Functions (Recommended)
Deploy backend as Vercel serverless functions:

1. Move backend routes to `frontend/api/` directory
2. Update environment variables in Vercel
3. Redeploy frontend

### Option B: Dedicated Server
Deploy backend to a dedicated server:

```bash
cd backend
npm install --production
npm run build
npm start
```

Use PM2 for process management:
```bash
npm install -g pm2
pm2 start src/server.js --name "afrostore-backend"
pm2 startup
pm2 save
```

## Step 6: Database Setup

### 6.1 Create Admin User
Run the admin creation script:
```bash
cd backend
node create-admin.js
```

### 6.2 Import Sample Data (Optional)
```bash
cd backend
node scripts/create-sample-data.js
```

## Step 7: Security Hardening

### 7.1 SSL/TLS Configuration
- Ensure HTTPS is enforced on all domains
- Configure HSTS headers (already included in helmet config)
- Set up SSL monitoring

### 7.2 Security Headers
The application includes comprehensive security headers via Helmet.js:
- Content Security Policy (CSP)
- HSTS
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy

### 7.3 Rate Limiting
Rate limiting is configured with:
- General rate limiter: 100 requests per 15 minutes
- Auth-specific rate limiting: 5 requests per minute
- Redis-backed rate limiting (if Redis is enabled)

## Step 8: Monitoring & Analytics

### 8.1 Vercel Analytics
1. Enable Vercel Analytics in project settings
2. Set up custom events for key user actions

### 8.2 Google Analytics
1. Set up Google Analytics 4 property
2. Add tracking ID to environment variables
3. Configure e-commerce tracking

### 8.3 Error Monitoring
Consider adding Sentry for error tracking:
```bash
npm install @sentry/nextjs @sentry/node
```

## Step 9: Performance Optimization

### 9.1 Image Optimization
- Images are automatically optimized via Next.js Image component
- Configure Cloudinary for CDN delivery

### 9.2 Caching Strategy
- Browser caching via Cache-Control headers
- Redis caching for API responses (if enabled)
- CDN caching via Vercel Edge Network

### 9.3 Bundle Optimization
- Code splitting is configured
- Dynamic imports for heavy components
- Tree shaking enabled

## Step 10: Testing & Validation

### 10.1 Pre-deployment Checklist
- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] SSL certificates configured
- [ ] Payment webhooks configured
- [ ] Email sending tested
- [ ] Admin account created
- [ ] Sample products added

### 10.2 Post-deployment Testing
1. **Authentication Flow**
   - User registration
   - Email verification
   - Login/logout
   - Password reset

2. **E-commerce Flow**
   - Product browsing
   - Add to cart
   - Checkout process
   - Payment processing

3. **Admin Functions**
   - Admin login
   - Product management
   - Order management
   - User management

## Step 11: Maintenance & Updates

### 11.1 Regular Maintenance Tasks
- Monitor error logs
- Update dependencies
- Backup database (Supabase handles this)
- Review security headers
- Monitor payment transactions

### 11.2 Update Process
1. Test updates in staging
2. Create database backup
3. Apply migrations if needed
4. Deploy updates
5. Verify functionality

## Troubleshooting

### Common Issues

#### 1. Authentication Failures
- Check Supabase configuration
- Verify environment variables
- Check redirect URLs in Supabase

#### 2. Payment Failures
- Verify Stripe/Paystack API keys
- Check webhook endpoints
- Review payment logs

#### 3. Database Connection Issues
- Verify Supabase credentials
- Check network connectivity
- Review RLS policies

#### 4. Performance Issues
- Check Vercel Analytics
- Monitor database queries
- Review caching configuration

### Getting Help
- Check application logs in Vercel dashboard
- Review Supabase logs
- Monitor error tracking (if configured)
- Check Stripe/Paystack dashboards

## Security Considerations

### Critical Security Points
1. **Environment Variables**: Never commit secrets to git
2. **API Keys**: Use service role keys only on backend
3. **Database**: Use RLS policies for all tables
4. **Authentication**: Use Supabase JWT tokens
5. **Payments**: Verify webhook signatures
6. **CORS**: Restrict to allowed origins only

### Regular Security Audits
- Review dependency vulnerabilities
- Check security headers
- Audit user permissions
- Monitor access logs
- Update SSL certificates

## Backup & Recovery

### Automated Backups
- Supabase provides automated database backups
- Code is versioned in Git
- Assets stored in Cloudinary

### Recovery Procedures
1. Database: Restore from Supabase backup
2. Code: Deploy from Git repository
3. Assets: Restore from Cloudinary backup

## Conclusion

Following this guide will result in a secure, scalable, and production-ready deployment of the Afro Superstore e-commerce platform. The architecture is designed to handle high traffic volumes while maintaining security and performance standards.

For ongoing maintenance, regularly monitor the application performance, security logs, and user feedback to ensure optimal operation.
