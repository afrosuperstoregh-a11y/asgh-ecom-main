-- Quick RLS Fix - Run this in Supabase SQL Editor immediately

-- Enable RLS on tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;

-- Create public read policies
CREATE POLICY "Enable read access for all categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for active products" ON products
    FOR SELECT USING (status = 'active');

-- Verify policies are created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
