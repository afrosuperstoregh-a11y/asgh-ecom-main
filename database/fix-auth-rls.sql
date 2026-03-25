-- Fix RLS Policies for User Authentication
-- Run this in Supabase Dashboard → SQL Editor

-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all profiles" ON users;

-- Create policy to allow users to read their own profile by email
CREATE POLICY "Users can read own profile" ON users
FOR SELECT USING (email = auth.email());

-- Create policy to allow admins to read all profiles
CREATE POLICY "Admins can read all profiles" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'RLS policies fixed successfully!';
    RAISE NOTICE 'Users can now read their own profiles';
    RAISE NOTICE 'Admins can read all user profiles';
END $$;
