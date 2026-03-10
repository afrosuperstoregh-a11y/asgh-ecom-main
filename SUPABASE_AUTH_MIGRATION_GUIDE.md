# Supabase Authentication Migration Guide

This guide walks through migrating from custom JWT authentication to Supabase Auth for the Afro Superstore e-commerce platform.

## Overview

The migration consolidates all authentication into Supabase Auth, removing:
- Custom JWT generation and verification
- Local password storage and hashing
- Manual session management
- Duplicate authentication logic

## Migration Steps

### 1. Database Setup

Run the migration scripts in order:

```sql
-- Run in Supabase SQL Editor or via migration tool
\i database/migrations/003_supabase_auth_migration.sql
\i database/migrations/004_remove_legacy_auth_columns.sql
```

### 2. Backend Changes

#### New Middleware
- `backend/src/middleware/supabaseAuth.js` - Replaces custom JWT verification
- Uses Supabase service role key for token verification
- Automatically creates user profiles in local database

#### Route Updates
Replace all instances of:
```javascript
const { authenticateToken, requireAdmin } = require('../middleware/auth');
```

With:
```javascript
const { verifySupabaseUser, requireAdmin } = require('../middleware/supabaseAuth');
```

And update route handlers:
```javascript
// Before
router.get('/protected', authenticateToken, async (req, res) => {

// After  
router.get('/protected', verifySupabaseUser, async (req, res) => {
```

### 3. Frontend Changes

#### New Files Created
- `frontend/lib/supabase.ts` - Enhanced Supabase client with auth helpers
- `frontend/contexts/AuthContext.tsx` - React context for auth state
- `frontend/components/auth/ProtectedRoute.tsx` - Route protection component
- `frontend/app/login/page.tsx` - Login page
- `frontend/app/register/page.tsx` - Registration page
- `frontend/app/forgot-password/page.tsx` - Password reset page

#### Updated Files
- `frontend/lib/api.ts` - Now uses Supabase tokens instead of localStorage
- `frontend/app/layout.tsx` - Includes AuthProvider

### 4. Environment Variables

Add to frontend `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Backend `.env` should already have:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Authentication Flow

### Login Flow
1. User enters credentials on `/login`
2. Frontend calls `supabase.auth.signInWithPassword()`
3. Supabase returns JWT access token
4. Token stored in Supabase client (secure, httpOnly cookies)
5. API requests automatically include token via axios interceptor

### Registration Flow
1. User signs up on `/register`
2. Frontend calls `supabase.auth.signUp()`
3. Supabase sends verification email
4. User clicks verification link
5. Backend middleware creates profile automatically

### API Authentication
1. Request includes `Authorization: Bearer <supabase_jwt>`
2. `verifySupabaseUser` middleware validates token
3. User profile fetched/created in local database
4. `req.user` populated with user data

## Security Improvements

### Row Level Security (RLS)
- Enabled on `profiles` table
- Users can only access their own data
- Admins can access all profiles
- Policies automatically enforced by Supabase

### Token Security
- No more localStorage tokens
- Supabase handles secure token storage
- Automatic token refresh
- PKCE flow for enhanced security

### Password Security
- No local password storage
- Supabase handles password hashing
- Built-in rate limiting and brute force protection
- Secure password reset flows

## Admin Role Management

### Setting Admin Roles
After migration, set admin roles in Supabase:

```sql
-- Update a user to admin role
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = 'user_uuid_from_auth_users';

-- Or use the Supabase Dashboard to update user metadata
```

### Role-Based Access
- `customer`: Default role, can access own data
- `admin`: Can access all user data and manage orders
- `super_admin`: Full system access

## Testing the Migration

### 1. Database Testing
```sql
-- Verify profiles table exists
SELECT * FROM profiles LIMIT 1;

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Test user view
SELECT * FROM users_with_profile LIMIT 1;
```

### 2. Backend Testing
```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test protected endpoint (should fail without token)
curl http://localhost:3001/api/orders
```

### 3. Frontend Testing
1. Visit `/register` and create a new account
2. Check email for verification link
3. Verify you can log in at `/login`
4. Test accessing protected routes

## Rollback Plan

If issues occur, you can rollback:

### Database Rollback
```sql
-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Restore backup if needed
INSERT INTO users SELECT * FROM users_backup;
```

### Code Rollback
- Revert server.js to enable old auth routes
- Restore original middleware imports in route files
- Revert frontend API client changes

## Post-Migration Cleanup

### Remove Legacy Files
- `backend/src/middleware/auth.js` (old auth middleware)
- `backend/src/routes/auth.js` (old auth routes)
- Any custom password handling code

### Update Documentation
- Update API documentation to reflect Supabase auth
- Update deployment procedures
- Update developer onboarding guides

## Monitoring

### Key Metrics to Monitor
- Login success rates
- Token validation errors
- Profile creation success
- RLS policy violations

### Logs to Watch
- Supabase auth logs
- Backend authentication errors
- Frontend auth state changes

## Support

For issues during migration:
1. Check Supabase logs for authentication errors
2. Verify database migrations completed successfully
3. Ensure environment variables are correctly set
4. Test with incognito browser to avoid cached sessions

## Next Steps

After successful migration:
1. Implement OAuth providers (Google, etc.)
2. Set up multi-factor authentication
3. Implement audit logging for admin actions
4. Add user impersonation for support
5. Set up automated user provisioning
