-- Supabase Row Level Security (RLS) Policies for Afro Superstore
-- Run this script in your Supabase SQL Editor

-- Enable RLS on all tables
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
-- DROP POLICY IF EXISTS "Public read access for active products" ON products;
-- DROP POLICY IF EXISTS "Public read access for active categories" ON categories;
-- DROP POLICY IF EXISTS "Users can view own profile" ON users;
-- DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Products Table Policies
-- Allow public read access for active products only
-- CREATE POLICY "Public read access for active products" ON products
--     FOR SELECT USING (status = 'active');

-- Allow service role to insert/update products (for admin operations)
-- CREATE POLICY "Service role can manage products" ON products
--     FOR ALL USING (auth.role() = 'service_role');

-- Categories Table Policies
-- Allow public read access for active categories only
-- CREATE POLICY "Public read access for active categories" ON categories
--     FOR SELECT USING (is_active = true);

-- Allow service role to manage categories (for admin operations)
-- CREATE POLICY "Service role can manage categories" ON categories
--     FOR ALL USING (auth.role() = 'service_role');

-- Users Table Policies (for future authentication)
-- Users can view their own profile
-- CREATE POLICY "Users can view own profile" ON users
--     FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own profile
-- CREATE POLICY "Users can update own profile" ON users
--     FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow service role to manage users (for admin operations)
-- CREATE POLICY "Service role can manage users" ON users
--     FOR ALL USING (auth.role() = 'service_role');

-- Reviews Table Policies (if exists)
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
--         ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
--         DROP POLICY IF EXISTS "Public read access for approved reviews" ON reviews;
--         DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
        
--         -- Allow public read access for approved reviews
--         CREATE POLICY "Public read access for approved reviews" ON reviews
--             FOR SELECT USING (status = 'approved');
        
--         -- Allow authenticated users to insert reviews
--         CREATE POLICY "Users can insert own reviews" ON reviews
--             FOR INSERT WITH CHECK (auth.uid()::text = customer_id::text);
        
--         -- Allow users to update their own reviews
--         CREATE POLICY "Users can update own reviews" ON reviews
--             FOR UPDATE USING (auth.uid()::text = customer_id::text);
--     END IF;
-- END $$;

-- Orders Table Policies (if exists)
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
--         ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
--         DROP POLICY IF EXISTS "Users can view own orders" ON orders;
        
--         -- Users can view their own orders
--         CREATE POLICY "Users can view own orders" ON orders
--             FOR SELECT USING (auth.uid()::text = customer_id::text);
        
--         -- Allow service role to manage orders
--         CREATE POLICY "Service role can manage orders" ON orders
--             FOR ALL USING (auth.role() = 'service_role');
--     END IF;
-- END $$;

-- Cart Table Policies (if exists)
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cart') THEN
--         ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
--         DROP POLICY IF EXISTS "Users can manage own cart" ON cart;
        
--         -- Users can manage their own cart items
--         CREATE POLICY "Users can manage own cart" ON cart
--             FOR ALL USING (auth.uid()::text = customer_id::text);
        
--         -- Allow anonymous users to manage cart by session
--         CREATE POLICY "Anonymous users can manage cart by session" ON cart
--             FOR ALL USING (session_id IS NOT NULL AND customer_id IS NULL);
--     END IF;
-- END $$;

-- Create indexes for better performance
-- CREATE INDEX IF NOT EXISTS idx_products_status_active ON products(status) WHERE status = 'active';
-- CREATE INDEX IF NOT EXISTS idx_products_featured_active ON products(featured, status) WHERE featured = true AND status = 'active';
-- CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active) WHERE is_active = true;
-- CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, status) WHERE status = 'active';

-- Grant necessary permissions
-- GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- GRANT SELECT ON products TO anon;
-- GRANT SELECT ON categories TO anon;
-- GRANT SELECT ON users TO authenticated;
-- GRANT ALL ON products TO service_role;
-- GRANT ALL ON categories TO service_role;
-- GRANT ALL ON users TO service_role;

-- Verify policies are in place
-- SELECT 
--     schemaname,
--     tablename,
--     policyname,
--     permissive,
--     roles,
--     cmd,
--     qual
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
