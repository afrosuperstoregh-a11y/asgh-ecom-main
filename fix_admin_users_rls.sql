-- Fix infinite recursion in RLS policies for admin_users
-- Issue: Categories/products policies query profiles, which has a relationship to admin_users
-- When admin_users has RLS enabled, this creates circular dependency
-- Solution: Disable RLS on admin_users since it's only accessed by service role

-- Disable RLS on admin_users table
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Verify the change
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'admin_users';
