# Vercel Deployment Guide for ASCA E-commerce Platform

## Overview
This guide will help you deploy the ASCA E-commerce Platform to Vercel. The platform has been refactored to use Vercel serverless functions instead of traditional backend servers.

## ✅ Final Project Structure

```
asca_ecom-main/
├── vercel.json                    # Vercel configuration
├── ecommerce-platform/
│   ├── frontend/                  # Next.js frontend + API routes
│   │   ├── app/
│   │   │   ├── api/              # Serverless API functions
│   │   │   │   ├── products/
│   │   │   │   ├── categories/
│   │   │   │   ├── testimonials/
│   │   │   │   └── auth/
│   │   │   └── ...pages
│   │   ├── lib/
│   │   │   └── api.js            # API client helper
│   │   └── .env.example          # Environment variables template
│   ├── backend-archived/         # Archived NestJS backend
│   └── api-archived/             # Archived Express.js API
```

## 🚀 Key Changes Made

1. **Backend Strategy**: Converted Express.js API to Vercel serverless functions
2. **Removed Servers**: Eliminated `app.listen()` and hardcoded ports
3. **API Routes**: Moved to `frontend/app/api/*` for Vercel compatibility
4. **Environment**: Updated for serverless architecture
5. **Configuration**: Fixed `vercel.json` for proper deployment

## Prerequisites

### 1. Vercel Account
- Create a free account at [vercel.com](https://vercel.com)
- Install Vercel CLI: `npm i -g vercel`

### 2. Database Setup (Optional)
- **PostgreSQL**: Set up if you need persistent data
- **Redis**: Set up if you need caching

### 3. External Services (Optional)
- **Stripe**: For payment processing
- **SendGrid**: For email services

## Environment Variables

### Required Environment Variables
Copy `ecommerce-platform/frontend/.env.example` to `.env.local` for local development:

```bash
# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# For Production (set in Vercel dashboard)
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app/api

# Optional Services
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key
SENDGRID_API_KEY=your-sendgrid-api-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
```

## Deployment Steps

### 1. Connect Repository to Vercel
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to Vercel dashboard and click "New Project"
3. Import your repository
4. Vercel will automatically detect the Next.js app

### 2. Configure Build Settings
Vercel will use the `vercel.json` configuration file:
- **Root Directory**: `ecommerce-platform/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. Set Environment Variables in Vercel
1. Go to Project Settings → Environment Variables
2. Add production variables:
   - `NEXT_PUBLIC_SITE_URL`: `https://your-domain.vercel.app`
   - `NEXT_PUBLIC_API_URL`: `https://your-domain.vercel.app/api`
3. Add any optional service variables

### 4. Deploy
1. Click "Deploy" to deploy your application
2. Vercel will build and deploy the frontend with serverless API functions
3. Your app will be available at `https://your-app-name.vercel.app`

## API Endpoints

After deployment, these endpoints will be available:

### Products
- `GET /api/products` - Get all products
- `GET /api/products/[id]` - Get specific product

### Categories
- `GET /api/categories` - Get all categories

### Testimonials
- `GET /api/testimonials` - Get all testimonials

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

## Testing the Deployment

### 1. Frontend Test
Visit your deployed URL and verify:
- Homepage loads correctly
- Navigation works
- Products display

### 2. API Test
Test these endpoints in your browser or with curl:
```bash
# Test products API
curl https://your-domain.vercel.app/api/products

# Test categories API
curl https://your-domain.vercel.app/api/categories

# Test auth
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123"}'
```

## Post-Deployment Configuration

### 1. Custom Domain
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### 2. Environment Updates
Update environment variables if you add external services

## Troubleshooting

### Common Issues

#### Build Failures
- Check `vercel.json` configuration
- Verify all dependencies are in `package.json`
- Check for missing environment variables

#### API Errors
- Check Vercel function logs
- Verify API routes are in `frontend/app/api/`
- Check CORS configuration

#### Runtime Errors
- Check Vercel function logs
- Verify environment variables
- Test API endpoints individually

### Debug Commands
```bash
# View deployment logs
vercel logs

# Locally test build
cd ecommerce-platform/frontend && npm run build

# Test environment variables
vercel env ls
```

## Performance Optimization

### 1. Serverless Functions
- Functions automatically scale with demand
- Cold starts are minimized with Vercel's edge network
- Each API route is an independent function

### 2. Caching
- Static assets are cached by Vercel's edge network
- API responses can be cached using Next.js caching

### 3. Database Optimization
- Use serverless-compatible database providers
- Implement connection pooling

## Security Best Practices

### 1. Environment Variables
- Never commit secrets to Git
- Use Vercel's encrypted environment variables
- Only expose necessary variables with `NEXT_PUBLIC_` prefix

### 2. API Security
- All API routes are serverless and isolated
- CORS is configured in `vercel.json`
- Implement proper authentication in API routes

## Success Criteria ✅

Your deployment is successful when:

- ✅ `vercel deploy` succeeds without errors
- ✅ Frontend loads correctly at your domain
- ✅ API routes respond at `/api/*` endpoints
- ✅ No server processes are running (fully serverless)
- ✅ Build process completes on Vercel
- ✅ Environment variables are properly configured

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)

## Next Steps

1. Set up monitoring with Vercel Analytics
2. Configure custom domain
3. Add external services as needed
4. Set up automated testing
5. Monitor function performance
