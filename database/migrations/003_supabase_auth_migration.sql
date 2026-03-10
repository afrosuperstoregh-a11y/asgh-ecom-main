-- Migration 003: Supabase Authentication Integration
-- This migration creates the profiles table to link with Supabase auth.users
-- and prepares the database for Supabase-only authentication

-- Create profiles table to store additional user data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to sync user data from auth.users to profiles
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new profile if user doesn't exist
  INSERT INTO profiles (user_id, first_name, last_name, role, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    email_verified = NEW.email_confirmed_at IS NOT NULL,
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile();

-- Create view for user data with profile information
CREATE OR REPLACE VIEW users_with_profile AS
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at as auth_created_at,
  u.last_sign_in_at,
  p.first_name,
  p.last_name,
  p.phone,
  p.role,
  p.email_verified,
  p.created_at,
  p.updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id;

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
GRANT ALL ON profiles TO service_role;

GRANT EXECUTE ON FUNCTION update_updated_at_column TO authenticated;
GRANT EXECUTE ON FUNCTION sync_user_profile TO service_role;

GRANT SELECT ON users_with_profile TO authenticated;
GRANT SELECT ON users_with_profile TO anon;

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile (handled by trigger)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create initial admin user profile (if you have an existing admin user)
-- This should be run after your first admin user signs up
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin-email@example.com';

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'Extended user profile data linked to Supabase auth.users';
COMMENT ON COLUMN profiles.user_id IS 'Reference to auth.users.id';
COMMENT ON COLUMN profiles.role IS 'User role: customer, admin, or super_admin';
COMMENT ON COLUMN profiles.email_verified IS 'Mirrors auth.users.email_confirmed_at';
COMMENT ON VIEW users_with_profile IS 'Combined view of auth.users and profiles data';
