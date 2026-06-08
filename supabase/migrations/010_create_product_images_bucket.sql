-- Migration 010: Create product-images storage bucket
-- This migration creates the product-images bucket if it doesn't exist

-- Insert the product-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view product-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view all product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload to product-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from product-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Service role has full access to product-images bucket" ON storage.objects;

-- Create policy for public read access to product-images
CREATE POLICY "Public can view product-images bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Create policy for authenticated users to upload to product-images
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
  );

-- Create policy for users to update their own files in product-images
CREATE POLICY "Users can update their own product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy for users to delete their own files in product-images
CREATE POLICY "Users can delete their own product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy for admins to manage product-images
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

-- Create policy for service role full access
CREATE POLICY "Service role has full access to product-images bucket" ON storage.objects
  FOR ALL USING (bucket_id = 'product-images' AND auth.role() = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT ALL ON SCHEMA storage TO service_role;
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO anon;

-- Output confirmation
SELECT 'Storage bucket product-images created and policies applied successfully' as status;
