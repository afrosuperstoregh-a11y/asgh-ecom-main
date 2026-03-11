# API Configuration Fix

## Issue
The frontend was configured to use the wrong API port and had an invalid Supabase service role key, causing 500 errors when trying to fetch products.

## Problems
1. **Wrong API Port**: Frontend was configured to use `http://localhost:3000` for API calls, but backend was running on `http://localhost:3002`
2. **Invalid Supabase Service Role Key**: Frontend had an incorrect/invalid `SUPABASE_SERVICE_ROLE_KEY` causing "Invalid API key" errors

## Solutions

### 1. API Port Configuration
**File:** `frontend/.env.local`
- Changed `NEXT_PUBLIC_API_URL` from `http://localhost:3000` to `http://localhost:3002`

### 2. Supabase Service Role Key Fix
**File:** `frontend/.env.local`
- Updated `SUPABASE_SERVICE_ROLE_KEY` to match the backend configuration
- Old key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...pL9z5k8YnZjL2A5Bz5j8nZ9jT7Y5nZ9jT7Y5nZ9jT7Y`
- New key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0`

## Verification
- ✅ Backend API tested successfully on port 3002
- ✅ Frontend API route `/api/products` now returns 200 status
- ✅ Products endpoint successfully returns 117 products
- ✅ Frontend restarted with new configuration

## Error Messages Resolved
- ❌ `Failed to load resource: the server responded with a status of 500 (api/products)`
- ❌ `Error loading products: Error: Failed to fetch products: 500`
- ❌ `Supabase query error: Invalid API key`

## Note
The `.env.local` file is in .gitignore for security reasons, so these changes are documented here for reference.

## Development Setup
For local development, ensure:
1. Backend runs on port 3002
2. Frontend `.env.local` points to `http://localhost:3002`
3. Both frontend and backend have matching Supabase credentials
4. Both services are running simultaneously
