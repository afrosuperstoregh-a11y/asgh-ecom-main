-- Direct SQL to activate all products
-- Run this in your Supabase SQL editor: https://supabase.com/dashboard/project/azpgqsmgyorjbqsgxuxw/sql

-- First, let's see current status distribution
SELECT status, COUNT(*) as count 
FROM products 
GROUP BY status 
ORDER BY count DESC;

-- Now activate all products by setting status to 'active'
UPDATE products 
SET status = 'active' 
WHERE status != 'active';

-- Verify the update worked
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
  COUNT(CASE WHEN status != 'active' THEN 1 END) as newly_activated
FROM products;

-- After running this, all products should have status = 'active'
-- Refresh your frontend to see all 117 products
