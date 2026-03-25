-- Updated RLS Policies for Afro Superstore
-- Run this in Supabase SQL Editor to fix authentication issues

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Users table policies - Allow users to read and update their own profile
CREATE POLICY "Users can read own profile" ON users
FOR SELECT USING (auth.uid()::text = id::text OR email = auth.email());

CREATE POLICY "Admins can read all profiles" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid()::text = id::text OR email = auth.email());

CREATE POLICY "Admins can update all profiles" ON users
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Create new policies with proper public access
CREATE POLICY "Public categories read" ON categories
FOR SELECT USING (true);

CREATE POLICY "Public products read" ON products
FOR SELECT USING (status = 'active');

-- Optional: Allow inserts for authenticated users (for admin functionality)
CREATE POLICY "Authenticated users can insert categories" ON categories
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update categories" ON categories
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert products" ON products
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update products" ON products
FOR UPDATE USING (auth.role() = 'authenticated' AND status = 'active');

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'RLS policies updated successfully!';
    RAISE NOTICE 'Users can now access their own profiles';
    RAISE NOTICE 'Admins can access all user profiles';
    RAISE NOTICE 'Public read access enabled for categories and active products';
END $$;
