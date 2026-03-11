# Frontend Setup Guide

## Environment Variables Setup

### 1. Create Environment File
Copy the example environment file:
```bash
cp frontend/.env.local.example frontend/.env.local
```

### 2. Required Environment Variables

#### Supabase Configuration (Required for API routes to work)
```env
# Get these from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Google Analytics (Optional)
```env
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### 3. Where to Find Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the Project URL (NEXT_PUBLIC_SUPABASE_URL)
4. Copy the anon public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
5. Copy the service_role key (SUPABASE_SERVICE_ROLE_KEY) - **Keep this secret!**

### 4. Verify Setup

After setting up the environment variables:

1. Restart your development server:
```bash
npm run dev
```

2. Check the browser console for any remaining errors
3. Visit `/api/products` directly to verify the API works

### 5. Common Issues

#### 500 Error from /api/products
- **Cause**: Missing or incorrect environment variables
- **Fix**: Ensure all three Supabase variables are set correctly in `.env.local`

#### Feature Collector Warning
- **Status**: ✅ Fixed - Updated to use single object configuration
- **No action needed**

#### Images Not Loading
- **Cause**: Incorrect Supabase storage configuration
- **Fix**: Ensure `NEXT_PUBLIC_SUPABASE_URL` is correct and storage bucket exists

### 6. Production Deployment

For production deployment, ensure these environment variables are set in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site settings → Build & deploy → Environment
- Other: Check your host's documentation

### 7. Testing the Fix

1. Set up environment variables as described above
2. Start the development server
3. Open browser to `http://localhost:3000`
4. Check console - no deprecation warnings should appear
5. Products should load from the API without 500 errors

## Security Notes

- **Never commit `.env.local` to version control**
- **SUPABASE_SERVICE_ROLE_KEY** gives admin access to your database
- **NEXT_PUBLIC_** variables are exposed to the browser
- **Keep service role keys secret and server-side only**
