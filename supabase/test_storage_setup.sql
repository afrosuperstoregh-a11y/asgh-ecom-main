-- Test Supabase Storage Upload Functionality
-- This script tests the storage policies and bucket setup

-- Check if product-images bucket exists
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'product-images';

-- Check existing storage policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Test storage permissions (run as service role to bypass RLS)
SELECT 
    bucket_id,
    name,
    created_at,
    updated_at,
    owner_id
FROM storage.objects 
WHERE bucket_id = 'product-images' 
LIMIT 5;

-- Check RLS status on storage.objects
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');

-- Output test results
SELECT 'Storage test completed' as status;
