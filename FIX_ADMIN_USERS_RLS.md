# Fix Infinite Recursion in Admin Users RLS Policy

## Problem

Error: `infinite recursion detected in policy for relation "admin_users"`

This error occurs when fetching categories and products because:
1. Categories/products RLS policies query the profiles table to check admin role
2. Profiles table has a foreign key relationship to admin_users (admin_users.user_id references profiles.id)
3. When admin_users has RLS enabled, this creates a circular dependency
4. Supabase detects this as infinite recursion

## Solution

Disable RLS on the admin_users table since it's only accessed by the service role anyway.

## Steps to Apply Fix

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `fix_admin_users_rls.sql`:

```sql
-- Disable RLS on admin_users table
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Verify the change
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'admin_users';
```

## Verification

After applying the fix:
1. Refresh your frontend application
2. Navigate to categories or products page
3. Verify the 500 error is resolved
4. Categories and products should load successfully

## Why This Works

- The admin_users table is only accessed by the service role (backend operations)
- It doesn't need RLS for public access
- Disabling RLS on this table breaks the circular dependency
- All other tables maintain their RLS policies for security
