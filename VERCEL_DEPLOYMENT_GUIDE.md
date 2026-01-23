# Vercel Deployment Guide for ASCA E-commerce Platform

## Overview
This guide will help you deploy the ASCA E-commerce Platform to Vercel. The platform consists of a Next.js frontend and NestJS backend.

## Prerequisites

### 1. Vercel Account
- Create a free account at [vercel.com](https://vercel.com)
- Install Vercel CLI: `npm i -g vercel`

### 2. Database Setup
- **PostgreSQL**: Set up a PostgreSQL database (recommended: Vercel Postgres or Supabase)
- **Redis**: Set up Redis for caching (recommended: Upstash Redis)

### 3. External Services
- **Stripe**: Create account and get API keys
- **SendGrid**: Set up for email services
- **Google/Facebook OAuth**: Set up social authentication

## Environment Variables

### Required Environment Variables
Copy the `.env.production` file and update these values:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://user:password@host:6379

# Authentication
NEXTAUTH_SECRET=your-super-secret-key-here
JWT_SECRET=your-jwt-secret-here

# Payment
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email
SENDGRID_API_KEY=your_sendgrid_api_key

# Social OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Deployment Steps

### 1. Connect Repository to Vercel
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to Vercel dashboard and click "New Project"
3. Import your repository
4. Vercel will automatically detect the Next.js app

### 2. Configure Build Settings
Vercel will use the `vercel.json` configuration file. Key settings:
- **Root Directory**: `ecommerce-platform/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. Set Environment Variables in Vercel
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.production`
3. Mark sensitive variables as "Secret"

### 4. Deploy
1. Click "Deploy" to deploy your application
2. Vercel will build and deploy both frontend and backend
3. Your app will be available at `https://your-app-name.vercel.app`

## Post-Deployment Configuration

### 1. Custom Domain
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### 2. Stripe Webhooks
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`

### 3. OAuth Redirects
Update OAuth redirect URIs in your provider dashboards:
- Google: `https://your-domain.com/api/auth/google/callback`
- Facebook: `https://your-domain.com/api/auth/facebook/callback`

## Monitoring and Analytics

### Vercel Analytics
- Enable in Project Settings → Analytics
- View performance metrics and user behavior

### Error Tracking
- Set up Sentry for error monitoring
- Add `SENTRY_DSN` to environment variables

## Performance Optimization

### 1. Image Optimization
- Images are automatically optimized by Vercel
- Use Next.js Image component for best performance

### 2. Caching
- Redis is configured for session management
- Static assets are cached by Vercel's edge network

### 3. Database Optimization
- Use connection pooling
- Enable query caching

## Troubleshooting

### Common Issues

#### Build Failures
- Check `vercel.json` configuration
- Verify all dependencies are in `package.json`
- Check for missing environment variables

#### Runtime Errors
- Check Vercel function logs
- Verify database connections
- Check CORS configuration

#### Payment Issues
- Verify Stripe webhook configuration
- Check API key permissions
- Ensure webhook secret matches

### Debug Commands
```bash
# View deployment logs
vercel logs

# Locally test build
npm run build

# Test environment variables
vercel env ls
```

## Scaling Considerations

### 1. Database Scaling
- Consider Vercel Postgres for automatic scaling
- Implement read replicas for high traffic

### 2. CDN Optimization
- Vercel's Edge Network automatically handles CDN
- Configure custom headers for additional caching

### 3. Function Scaling
- Vercel automatically scales serverless functions
- Monitor function execution time and memory usage

## Security Best Practices

### 1. Environment Variables
- Never commit secrets to Git
- Use Vercel's encrypted environment variables
- Rotate secrets regularly

### 2. API Security
- Enable rate limiting (configured in `.env.production`)
- Use HTTPS everywhere
- Implement proper CORS policies

### 3. Database Security
- Use connection strings with SSL
- Implement proper user permissions
- Regular backups

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [ASCA Platform Documentation](./README.md)

## Next Steps

1. Set up monitoring and alerting
2. Configure automated testing
3. Set up CI/CD pipeline
4. Plan for disaster recovery
5. Regular security audits
