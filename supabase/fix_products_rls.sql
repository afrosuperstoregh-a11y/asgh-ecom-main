-- Fix Products Table RLS Policies for Admin Operations
-- This script adds proper RLS policies to allow admin users to perform CRUD operations

-- First, ensure RLS is enabled on the products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies on products
DROP POLICY IF EXISTS "Enable read access for active products" ON products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;

-- Create public read policy for active products (for storefront)
CREATE POLICY "Enable read access for active products" ON products
    FOR SELECT USING (status = 'active');

-- Create admin policies for full CRUD operations
-- Admin users can read all products regardless of status
CREATE POLICY "Admins can read all products" ON products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Admin users can insert products
CREATE POLICY "Admins can insert products" ON products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Admin users can update products
CREATE POLICY "Admins can update products" ON products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Admin users can delete products
CREATE POLICY "Admins can delete products" ON products
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Also fix categories table RLS if needed
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies on categories
DROP POLICY IF EXISTS "Enable read access for all categories" ON categories;

-- Create public read policy for active categories
CREATE POLICY "Enable read access for active categories" ON categories
    FOR SELECT USING (is_active = true);

-- Create admin policies for categories
CREATE POLICY "Admins can read all categories" ON categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can insert categories" ON categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update categories" ON categories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can delete categories" ON categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Grant necessary permissions to service role for admin operations
-- This allows the admin API to bypass RLS when using service role key
GRANT ALL ON products TO service_role;
GRANT ALL ON categories TO service_role;

-- Output confirmation
SELECT 'Products and categories RLS policies updated successfully' as status;
