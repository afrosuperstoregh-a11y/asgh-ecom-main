-- AfroSuperStore Supabase Row Level Security (RLS) Policies
-- Migration 002: Enable RLS and create security policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()::text
        )
    );

-- Admins can update all users
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()::text
        )
    );

-- Public can insert new users (registration)
CREATE POLICY "Public can register" ON users
    FOR INSERT WITH CHECK (true);

-- Categories table policies (public read access)
CREATE POLICY "Public can view categories" ON categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()::text
        )
    );

-- Products table policies
CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()::text
        )
    );

-- Orders table policies
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (customer_id = auth.uid()::text);

CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT WITH CHECK (customer_id = auth.uid()::text);

CREATE POLICY "Admins can update orders" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()::text
        )
    );

-- Order items table policies
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.customer_id = auth.uid()::text
        )
    );

CREATE POLICY "Admins can view all order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can create own order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.customer_id = auth.uid()::text
        )
    );

-- Cart table policies
CREATE POLICY "Users can view own cart" ON cart
    FOR SELECT USING (customer_id = auth.uid()::text);

CREATE POLICY "Users can manage own cart" ON cart
    FOR ALL USING (customer_id = auth.uid()::text);

CREATE POLICY "Guest users can manage cart by session" ON cart
    FOR ALL USING (customer_id IS NULL AND session_id IS NOT NULL);

-- Reviews table policies
CREATE POLICY "Public can view approved reviews" ON reviews
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view own reviews" ON reviews
    FOR SELECT USING (customer_id = auth.uid()::text);

CREATE POLICY "Users can create own reviews" ON reviews
    FOR INSERT WITH CHECK (customer_id = auth.uid()::text);

CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (customer_id = auth.uid()::text);

CREATE POLICY "Admins can manage reviews" ON reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()::text
        )
    );

-- Inventory logs table policies
CREATE POLICY "Admins can view inventory logs" ON inventory_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Admins can create inventory logs" ON inventory_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()::text
        )
    );

-- Payments table policies
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = payments.order_id 
            AND orders.customer_id = auth.uid()::text
        )
    );

CREATE POLICY "Admins can view all payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Admins can manage payments" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()::text
        )
    );

-- Admin users table policies
CREATE POLICY "Admins can manage admin users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()::text
        )
    );

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.user_id = is_admin.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM users 
        WHERE id = auth.uid()::text
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
