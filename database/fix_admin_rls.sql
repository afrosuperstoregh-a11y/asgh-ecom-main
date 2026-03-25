-- Fix Admin RLS Permission Issue
-- This script creates admin policies that work with custom token authentication

-- First, let's disable RLS temporarily for admin operations
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Create a new approach: Use service role bypass for admin operations
-- The admin APIs will use the service role key instead of anon key

-- Re-enable RLS with admin bypass policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Public can view categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- Create public read policies (for frontend)
CREATE POLICY "Enable read access for all products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all categories" ON categories
    FOR SELECT USING (true);

-- Create admin management policies that work with service role
-- These will only apply when using anon key (public access)
CREATE POLICY "Public cannot modify products" ON products
    FOR INSERT WITH CHECK (false);
    
CREATE POLICY "Public cannot update products" ON products
    FOR UPDATE USING (false);
    
CREATE POLICY "Public cannot delete products" ON products
    FOR DELETE USING (false);

CREATE POLICY "Public cannot modify categories" ON categories
    FOR INSERT WITH CHECK (false);
    
CREATE POLICY "Public cannot update categories" ON categories
    FOR UPDATE USING (false);
    
CREATE POLICY "Public cannot delete categories" ON categories
    FOR DELETE USING (false);

-- Verify policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
