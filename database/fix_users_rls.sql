-- Fix RLS Policies for Users Table
-- Run this in Supabase SQL Editor to fix authentication issues

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON users;

-- Simple policy: Allow users to read their own profile by email matching
CREATE POLICY "Users can read own profile" ON users
FOR SELECT USING (email = auth.email());

-- Allow admins to read all profiles (they need to check other users' roles)
CREATE POLICY "Admins can read all profiles" ON users
FOR SELECT USING (
  email = auth.email() OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (email = auth.email());

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON users
FOR UPDATE USING (
  email = auth.email() OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Users table RLS policies updated successfully!';
    RAISE NOTICE 'Users can now access their own profiles using email matching';
    RAISE NOTICE 'Admins can access all user profiles';
END $$;
