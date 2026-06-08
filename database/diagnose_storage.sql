-- Diagnostic script to check Supabase Storage configuration
-- Run this in Supabase SQL Editor to verify storage setup

-- Check if storage extension is enabled
SELECT 
    name,
    default_version,
    installed_version
FROM pg_available_extensions
WHERE name = 'pgcrypto';

-- Check storage buckets
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
ORDER BY id;

-- Check storage policies for product-images bucket
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
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- Check storage objects in product-images bucket (sample)
SELECT 
    id,
    bucket_id,
    name,
    size,
    content_type,
    created_at,
    updated_at,
    last_accessed_at
FROM storage.objects
WHERE bucket_id = 'product-images'
ORDER BY created_at DESC
LIMIT 20;

-- Check if RLS is enabled on storage.objects
SELECT 
    relname,
    relrowsecurity
FROM pg_class
WHERE relname = 'objects'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');

-- Check permissions on storage schema
SELECT 
    grantee,
    table_schema,
    privilege_type,
    table_name
FROM information_schema.role_table_grants
WHERE table_schema = 'storage'
ORDER BY grantee, table_name, privilege_type;
