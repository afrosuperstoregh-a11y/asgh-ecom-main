# API Configuration Fix

## Issue
The frontend was configured to use the wrong API port, causing 500 errors when trying to fetch products.

## Problem
- Frontend was configured to use `http://localhost:3000` for API calls
- Backend was running on `http://localhost:3002`
- This caused API connection failures

## Solution
Updated the frontend environment configuration:

**File:** `frontend/.env.local`
- Changed `NEXT_PUBLIC_API_URL` from `http://localhost:3000` to `http://localhost:3002`

## Verification
- ✅ Backend API tested successfully on port 3002
- ✅ Frontend restarted with new configuration
- ✅ Products endpoint now accessible

## Note
The `.env.local` file is in .gitignore for security reasons, so this change is documented here for reference.

## Development Setup
For local development, ensure:
1. Backend runs on port 3002
2. Frontend `.env.local` points to `http://localhost:3002`
3. Both services are running simultaneously
