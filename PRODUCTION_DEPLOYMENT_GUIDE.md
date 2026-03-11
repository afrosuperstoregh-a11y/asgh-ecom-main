# Production Deployment Guide

## Environment Variables for Production

### Required Variables
These must be set in your production environment (Vercel, Netlify, etc.):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

## Production API Behavior

The `/api/products` endpoint now includes **production-ready fallbacks**:

### ✅ Normal Operation
- Connects to Supabase database
- Returns real product data
- Proper pagination and filtering

### 🔄 Fallback Mode (Production Only)
If environment variables are missing or database is unavailable:
- Returns mock product data (3 sample products)
- Maintains API response structure
- Prevents 500 errors
- Logs errors for debugging

### 🚫 Development Mode
- Shows detailed error messages
- Returns 500 status for missing configuration
- Helps identify setup issues

## Deployment Checklist

### 1. Environment Variables
- [ ] Set all Supabase variables in production
- [ ] Verify Supabase project is active
- [ ] Test database connectivity

### 2. Database Setup
- [ ] Products table exists
- [ ] Categories table exists  
- [ ] Row Level Security policies configured
- [ ] Sample data available (optional)

### 3. Testing
- [ ] Test `/api/products` endpoint
- [ ] Verify product loading on homepage
- [ ] Check browser console for errors

## Platform-Specific Setup

### Vercel
1. Go to Project Settings → Environment Variables
2. Add all required variables
3. Redeploy the project

### Netlify  
1. Go to Site settings → Build & deploy → Environment
2. Add all required variables
3. Trigger new deployment

### Other Platforms
Check your hosting provider's documentation for environment variable setup.

## Troubleshooting

### 500 Errors in Production
1. Check environment variables are set correctly
2. Verify Supabase project status
3. Check function logs for detailed errors

### Products Not Loading
1. API will fall back to mock data automatically
2. Check browser network tab for API responses
3. Verify Supabase connection in logs

### Missing Environment Variables
The API will automatically:
- Log the missing variables
- Return mock data in production
- Prevent complete failure

## Monitoring

### Production Logs
Monitor your hosting platform's logs for:
- Database connection errors
- Missing environment variable warnings
- API performance metrics

### Health Check
Test the API endpoint directly:
```
curl https://your-domain.com/api/products
```

Expected response structure:
```json
{
  "success": true,
  "data": {
    "products": [...],
    "categories": [...],
    "pagination": {...}
  }
}
```
