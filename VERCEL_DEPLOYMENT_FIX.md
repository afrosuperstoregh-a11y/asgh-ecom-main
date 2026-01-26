# Vercel Deployment Fix Guide

## Current Issues Identified
1. **Multiple vercel.json files** - Fixed by removing root version and updating frontend version
2. **API routes not deploying** - Fixed by adding proper rewrites and functions configuration
3. **Domain configuration** - Needs to be set up in Vercel dashboard

## Deployment Status
- ✅ API routes configured correctly
- ✅ Next.js config updated to use `/api` instead of `localhost:3001`
- ✅ Vercel.json updated with proper rewrites and functions
- ❌ Custom domain `www.afrosuperstore.ca` not configured

## Next Steps for Domain Configuration

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and log in
2. Navigate to your project: `asca-ecommerce-platform`
3. Go to the **Settings** tab

### Step 2: Add Custom Domain
1. Click on **Domains** in the left sidebar
2. Click **Add** or **Add Custom Domain**
3. Enter: `www.afrosuperstore.ca`
4. Click **Add**

### Step 3: Configure DNS
After adding the domain, Vercel will provide DNS records. You'll need to:

1. **Go to your domain registrar** (where you bought `afrosuperstore.ca`)
2. **Add these DNS records:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 300 (or default)
   ```

### Step 4: Verify Domain
1. Wait for DNS propagation (5-30 minutes)
2. Go back to Vercel dashboard
3. Click **Verify** next to your domain
4. The domain should show as verified

### Step 5: Test API Endpoints
Once the domain is configured, test these URLs:
- `https://www.afrosuperstore.ca/api/health`
- `https://www.afrosuperstore.ca/api/admin/auth/login`
- `https://www.afrosuperstore.ca/api/analytics`

## Alternative: Use Vercel Default URL
If domain setup takes time, you can use the Vercel-provided URL:
1. Go to your Vercel project dashboard
2. Copy the **Deployment URL** (e.g., `asca-ecommerce-platform.vercel.app`)
3. Test API endpoints with that URL

## Environment Variables
Ensure these are set in Vercel dashboard:
- `NEXT_PUBLIC_API_URL=/api`
- `NEXT_PUBLIC_SITE_URL=https://www.afrosuperstore.ca`

## Troubleshooting
If API routes still don't work:
1. Check Vercel deployment logs for errors
2. Verify the build completed successfully
3. Check Functions tab in Vercel dashboard
4. Ensure all API files are in `app/api/` directory

## Current Super Admin Credentials
- Email: `info@afrosuperstore.ca`
- Password: `Iamtech@100`
