-- Fix Recursive RLS Policies Migration
-- This migration fixes infinite recursion issues in RLS policies
-- Root cause: Policies that query the same table they protect

-- ============================================================================
-- PRIORITY 1: Fix admin_users infinite recursion
-- ============================================================================

-- Drop the problematic recursive policy on admin_users
DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;

-- Create a SECURITY DEFINER function to check admin status safely
-- This function bypasses RLS and queries profiles directly
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user has admin role in profiles table
  -- This bypasses RLS because it's SECURITY DEFINER
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon;

-- Create safe admin_users policies
-- Only service role can manage admin_users directly
DROP POLICY IF EXISTS "Service role has full access to admin_users" ON admin_users;
CREATE POLICY "Service role has full access to admin_users" ON admin_users
  FOR ALL USING (auth.role() = 'service_role');

-- Admins can view admin_users (but not modify) using the safe function
CREATE POLICY "Admins can view admin_users" ON admin_users
  FOR SELECT USING (public.is_admin_user());

-- ============================================================================
-- PRIORITY 2: Fix profiles recursive policies
-- ============================================================================

-- Drop recursive policies on profiles that query profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;

-- Create safe admin policies using the is_admin_user function
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can delete all profiles" ON profiles
  FOR DELETE USING (public.is_admin_user());

-- Ensure user can still view/update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- PRIORITY 3: Fix categories policies
-- ============================================================================

-- Drop existing categories policies
DROP POLICY IF EXISTS "Public can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Service role has full access to categories" ON categories;
DROP POLICY IF EXISTS "Public can view categories" ON categories;

-- Create safe categories policies
-- Public can view active categories
CREATE POLICY "Public can view active categories" ON categories
  FOR SELECT USING (is_active = true);

-- Admins can manage categories using safe function
CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (public.is_admin_user());

-- Service role has full access
CREATE POLICY "Service role has full access to categories" ON categories
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- PRIORITY 4: Fix products policies
-- ============================================================================

-- Drop existing products policies
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Service role has full access to products" ON products;
DROP POLICY IF EXISTS "Public can view products" ON products;

-- Create safe products policies
-- Public can view active products
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (status = 'active');

-- Admins can manage products using safe function
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (public.is_admin_user());

-- Service role has full access
CREATE POLICY "Service role has full access to products" ON products
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- PRIORITY 5: Fix orders policies
-- ============================================================================

-- Drop recursive orders policies
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete all orders" ON orders;

-- Create safe orders policies
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can delete all orders" ON orders
  FOR DELETE USING (public.is_admin_user());

-- Ensure users can view their own orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (customer_id = auth.uid());

-- ============================================================================
-- PRIORITY 6: Fix product_images policies
-- ============================================================================

-- Drop existing product_images policies
DROP POLICY IF EXISTS "Public can view product images" ON product_images;
DROP POLICY IF EXISTS "Admins can manage product images" ON product_images;
DROP POLICY IF EXISTS "Service role has full access to product_images" ON product_images;

-- Create safe product_images policies
-- Public can view all product images
CREATE POLICY "Public can view product images" ON product_images
  FOR SELECT USING (true);

-- Admins can manage product images
CREATE POLICY "Admins can manage product images" ON product_images
  FOR ALL USING (public.is_admin_user());

-- Service role has full access
CREATE POLICY "Service role has full access to product_images" ON product_images
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- PRIORITY 7: Fix reviews policies
-- ============================================================================

-- Drop recursive reviews policies
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;

-- Create safe reviews policies
CREATE POLICY "Admins can manage reviews" ON reviews
  FOR ALL USING (public.is_admin_user());

-- ============================================================================
-- PRIORITY 8: Fix inventory_logs policies
-- ============================================================================

-- Drop recursive inventory_logs policies
DROP POLICY IF EXISTS "Admins can view inventory logs" ON inventory_logs;
DROP POLICY IF EXISTS "Admins can create inventory logs" ON inventory_logs;

-- Create safe inventory_logs policies
CREATE POLICY "Admins can view inventory logs" ON inventory_logs
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admins can create inventory logs" ON inventory_logs
  FOR INSERT WITH CHECK (public.is_admin_user());

-- ============================================================================
-- PRIORITY 9: Fix payments policies
-- ============================================================================

-- Drop recursive payments policies
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage payments" ON payments;

-- Create safe payments policies
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admins can manage payments" ON payments
  FOR ALL USING (public.is_admin_user());

-- ============================================================================
-- PRIORITY 10: Fix order_items policies
-- ============================================================================

-- Drop recursive order_items policies
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

-- Create safe order_items policies
CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (public.is_admin_user());

-- ============================================================================
-- PRIORITY 11: Fix cart policies
-- ============================================================================

-- Drop existing cart policies
DROP POLICY IF EXISTS "Users can manage own cart" ON cart;
DROP POLICY IF EXISTS "Service role has full access to cart" ON cart;
DROP POLICY IF EXISTS "Guest users can manage cart by session" ON cart;

-- Create safe cart policies
CREATE POLICY "Users can manage own cart" ON cart
  FOR ALL USING (customer_id = auth.uid());

CREATE POLICY "Guest users can manage cart by session" ON cart
  FOR ALL USING (customer_id IS NULL AND session_id IS NOT NULL);

CREATE POLICY "Service role has full access to cart" ON cart
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- PRIORITY 12: Fix wishlist policies
-- ============================================================================

-- Drop existing wishlist policies
DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Service role has full access to wishlist" ON wishlist;

-- Create safe wishlist policies
CREATE POLICY "Users can manage own wishlist" ON wishlist
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role has full access to wishlist" ON wishlist
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- PRIORITY 13: Fix addresses policies
-- ============================================================================

-- Drop existing addresses policies
DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;
DROP POLICY IF EXISTS "Service role has full access to addresses" ON addresses;

-- Create safe addresses policies
CREATE POLICY "Users can manage own addresses" ON addresses
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role has full access to addresses" ON addresses
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- PRIORITY 14: Fix Storage Bucket RLS Policies
-- ============================================================================

-- Drop existing storage policies that query profiles recursively
DROP POLICY IF EXISTS "Admins can upload to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from products bucket" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload to product-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from product-images bucket" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload to category-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update category-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from category-images bucket" ON storage.objects;

DROP POLICY IF EXISTS "Admins can manage user-avatars bucket" ON storage.objects;

-- Create safe storage policies using the is_admin_user function

-- Products bucket
CREATE POLICY "Admins can upload to products bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' AND
    public.is_admin_user()
  );

CREATE POLICY "Admins can update products bucket" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'products' AND
    public.is_admin_user()
  );

CREATE POLICY "Admins can delete from products bucket" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products' AND
    public.is_admin_user()
  );

-- Product-images bucket
CREATE POLICY "Admins can upload to product-images bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    public.is_admin_user()
  );

CREATE POLICY "Admins can update product-images bucket" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' AND
    public.is_admin_user()
  );

CREATE POLICY "Admins can delete from product-images bucket" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND
    public.is_admin_user()
  );

-- Category-images bucket
CREATE POLICY "Admins can upload to category-images bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'category-images' AND
    public.is_admin_user()
  );

CREATE POLICY "Admins can update category-images bucket" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'category-images' AND
    public.is_admin_user()
  );

CREATE POLICY "Admins can delete from category-images bucket" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'category-images' AND
    public.is_admin_user()
  );

-- User-avatars bucket
CREATE POLICY "Admins can manage user-avatars bucket" ON storage.objects
  FOR ALL USING (
    bucket_id = 'user-avatars' AND
    public.is_admin_user()
  );

-- ============================================================================
-- Verification: Check for any remaining recursive policies
-- ============================================================================

-- This query helps identify any policies that might still be recursive
-- Run this after migration to verify no recursion exists
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
WHERE 
  qual LIKE '%' || tablename || '%'
  OR with_check LIKE '%' || tablename || '%';
