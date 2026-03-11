# Production Deployment Guide

## Environment Variables Configuration

Your application will fail in production if these environment variables are not configured:

### Required Variables

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Example: `https://your-project-id.supabase.co`
   - Get from: Supabase Dashboard → Settings → API

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Get from: Supabase Dashboard → Settings → API

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Your Supabase service role key (admin access)
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Get from: Supabase Dashboard → Settings → API
   - **Important**: Keep this secret and never expose it to clients

## Platform-Specific Instructions

### Vercel
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the three required variables above
4. Redeploy your application

### Netlify
1. Go to Site settings → Build & deploy → Environment
2. Add the three required variables above
3. Trigger a new deployment

### Railway
1. Go to your Railway project
2. Navigate to the Variables tab
3. Add the three required variables above
4. Railway will automatically redeploy

## Testing Your Deployment

After deployment, test these endpoints:

1. **Products API**: `https://yourdomain.com/api/products`
   - Should return JSON with products data
   - Should NOT return a 500 error

2. **Categories API**: `https://yourdomain.com/api/categories`
   - Should return JSON with categories data

## Common Issues & Solutions

### 500 Error on /api/products
**Cause**: Missing environment variables
**Solution**: Ensure all three required variables are configured in your hosting platform

### Environment Variables Not Loading
**Cause**: Variables not set correctly in hosting platform
**Solution**: Double-check variable names and values match exactly

### Supabase Connection Failed
**Cause**: Invalid Supabase URL or keys
**Solution**: Verify your Supabase project is active and keys are correct

## Verification Steps

1. ✅ Environment variables configured in hosting platform
2. ✅ Supabase project is active and accessible
3. ✅ API endpoints return 200 status
4. ✅ Products display correctly on frontend
5. ✅ No 500 errors in browser console

## Debug Mode

If you're still having issues, check your hosting platform's logs:
- Vercel: Functions tab → Logs
- Netlify: Site settings → Build & deploy → Deploys → View build log
- Railway: Logs tab in your project

The application now includes strict environment validation that will fail fast with clear error messages if variables are missing.
