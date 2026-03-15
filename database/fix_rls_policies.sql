-- Updated RLS Policies for Afro Superstore
-- Run this in Supabase SQL Editor to fix authentication issues

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;

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
    RAISE NOTICE 'Public read access enabled for categories and active products';
END $$;
