-- SQL script to activate all products
-- Run this in your Supabase SQL editor or via API

-- First, let's see what statuses exist
SELECT status, COUNT(*) as count 
FROM products 
GROUP BY status 
ORDER BY count DESC;

-- Update all products to have 'active' status
UPDATE products 
SET status = 'active' 
WHERE status != 'active';

-- Verify the update
SELECT status, COUNT(*) as count 
FROM products 
GROUP BY status 
ORDER BY count DESC;
