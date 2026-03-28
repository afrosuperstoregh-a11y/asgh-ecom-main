-- Fix Supabase Storage RLS Policies for Product Images Bucket
-- This script creates proper RLS policies to allow authenticated users to upload files

-- First, ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies on storage.objects for product-images bucket
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view all product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

-- Create policy for authenticated users to upload files to product-images bucket
-- This policy allows any authenticated user to upload to the product-images bucket
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-images' 
        AND auth.role() = 'authenticated'
    );

-- Create policy for users to update their own files in product-images bucket
CREATE POLICY "Users can update their own product images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'product-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create policy for users to delete their own files in product-images bucket
CREATE POLICY "Users can delete their own product images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'product-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create policy for public read access to all product images
CREATE POLICY "Public can view all product images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'product-images'
    );

-- Grant necessary permissions to authenticated users
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Grant necessary permissions to service role for admin operations
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role;

-- Grant necessary permissions to anon users for public access
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO anon;

-- Ensure the product-images bucket exists and is publicly accessible for reads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Output confirmation
SELECT 'Storage RLS policies for product-images bucket created successfully' as status;
