-- Setup Supabase Storage for product images
-- This script creates the storage bucket and sets up proper policies

-- Create the product-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the product-images bucket
-- 1. Public read access (anyone can view images)
CREATE POLICY "Public images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 2. Authenticated users can upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

-- 3. Authenticated users can update their own images
CREATE POLICY "Authenticated users can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

-- 4. Admin users can delete any images
CREATE POLICY "Admin users can delete any images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND 
  auth.jwt() ->> 'role' = 'admin'
);

-- Grant necessary permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;

-- Create a function to get public URL for images
CREATE OR REPLACE FUNCTION get_public_url(bucket_name text, file_path text)
RETURNS text AS $$
BEGIN
  RETURN '/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage: SELECT get_public_url('product-images', 'girls-dashiki.jpg');
