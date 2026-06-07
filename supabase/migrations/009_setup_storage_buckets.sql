-- Migration 009: Setup Supabase Storage buckets and policies
-- This migration creates the required storage buckets and configures access policies

-- Note: Storage buckets must be created via Supabase Management API or Dashboard
-- This migration sets up the policies after buckets are created manually
-- Run this after creating buckets: products, product-images, category-images, user-avatars

-- Enable storage extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Storage bucket policies
-- These policies control who can upload, download, and manage files in each bucket

-- Products bucket policies (public read access, admin write access)
CREATE POLICY "Public can view products bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Admins can upload to products bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update products bucket" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete from products bucket" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role has full access to products bucket" ON storage.objects
  FOR ALL USING (bucket_id = 'products' AND auth.role() = 'service_role');

-- Product-images bucket policies (public read access, admin write access)
CREATE POLICY "Public can view product-images bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload to product-images bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update product-images bucket" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete from product-images bucket" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role has full access to product-images bucket" ON storage.objects
  FOR ALL USING (bucket_id = 'product-images' AND auth.role() = 'service_role');

-- Category-images bucket policies (public read access, admin write access)
CREATE POLICY "Public can view category-images bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'category-images');

CREATE POLICY "Admins can upload to category-images bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'category-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update category-images bucket" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'category-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete from category-images bucket" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'category-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role has full access to category-images bucket" ON storage.objects
  FOR ALL USING (bucket_id = 'category-images' AND auth.role() = 'service_role');

-- User-avatars bucket policies (users can view own, users can upload own, admin full access)
CREATE POLICY "Users can view user-avatars bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload to user-avatars bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can manage user-avatars bucket" ON storage.objects
  FOR ALL USING (
    bucket_id = 'user-avatars' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role has full access to user-avatars bucket" ON storage.objects
  FOR ALL USING (bucket_id = 'user-avatars' AND auth.role() = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT ALL ON SCHEMA storage TO service_role;
