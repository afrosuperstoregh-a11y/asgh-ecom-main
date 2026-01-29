-- Supabase Storage Configuration for Afro Superstore
-- Run this SQL in Supabase SQL Editor to set up storage buckets and policies

-- Create storage buckets for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for category images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-images',
  'category-images', 
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Row Level Security (RLS) Policies

-- Product Images Policies
-- Anyone can view product images
CREATE POLICY "Public product images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Only authenticated users can upload product images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Only admins can update/delete product images
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role IN ('admin', 'super_admin')
    )
  )
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role IN ('admin', 'super_admin')
    )
  )
);

-- Category Images Policies
-- Anyone can view category images
CREATE POLICY "Public category images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');

-- Only admins can manage category images
CREATE POLICY "Admins can manage category images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'category-images' 
  AND (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role IN ('admin', 'super_admin')
    )
  )
);

-- User Avatars Policies
-- Anyone can view user avatars
CREATE POLICY "Public user avatars are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a function to get public URL for files
CREATE OR REPLACE FUNCTION get_public_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 
    'https://' || current_setting('app.settings.supabase_url') || 
    '/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;

-- Verify bucket creation
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  created_at
FROM storage.buckets 
WHERE name IN ('product-images', 'category-images', 'user-avatars');
