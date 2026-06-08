-- Diagnostic script to check product image data structure
-- Run this in Supabase SQL Editor to verify product data

-- Check products table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Sample product data with image fields
SELECT 
    id,
    name,
    image_url,
    images,
    category_id,
    status,
    created_at
FROM products
ORDER BY created_at DESC
LIMIT 10;

-- Check for different image field patterns
SELECT 
    COUNT(*) as total_products,
    COUNT(image_url) as has_image_url,
    COUNT(images) as has_images_field,
    COUNT(CASE WHEN images IS NOT NULL AND jsonb_array_length(images::jsonb) > 0 THEN 1 END) as has_images_array,
    COUNT(CASE WHEN image_url IS NULL AND (images IS NULL OR images = '[]'::jsonb) THEN 1 END) as no_images
FROM products;

-- Check image URL patterns
SELECT 
    CASE 
        WHEN image_url LIKE 'http%' THEN 'Full URL'
        WHEN image_url LIKE '/%' THEN 'Relative path'
        WHEN image_url IS NULL THEN 'NULL'
        ELSE 'Other'
    END as url_pattern,
    COUNT(*) as count
FROM products
WHERE image_url IS NOT NULL
GROUP BY url_pattern;

-- Check for bucket name in image paths
SELECT 
    CASE 
        WHEN image_url LIKE '%product-images%' THEN 'Contains product-images'
        WHEN image_url LIKE '%products%' THEN 'Contains products'
        WHEN image_url LIKE '%category-images%' THEN 'Contains category-images'
        ELSE 'Other pattern'
    END as bucket_pattern,
    COUNT(*) as count
FROM products
WHERE image_url IS NOT NULL
GROUP BY bucket_pattern;
