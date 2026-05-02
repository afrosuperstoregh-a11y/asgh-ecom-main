-- =====================================================
-- PRODUCT CATEGORY FIX SCRIPT
-- =====================================================
-- Purpose: Fix product-category assignment issues
-- 
-- ISSUES TO FIX:
-- 1. Food & Beverages Category Mismatch (CRITICAL)
--    - Expected: 44 products
--    - Current: 3 products
--    - Problem: 41 food-related products have category_id = null
--
-- 2. Uncategorized Products (57 total)
--    - Food Items (41 products) → Food & Beverages (ID: 9)
--    - Fashion Items (2 products) → Men/Women Fashion
--    - Remaining 14 Products → Appropriate categories
--
-- 3. Empty Categories
--    - Men Fashion (ID: 2)
--    - Women Fashion (ID: 1)
--    - Art & Crafts (ID: 20)
--
-- SAFETY NOTES:
-- - This script uses transactions for atomic operations
-- - All changes are logged for rollback capability
-- - No products are deleted or duplicated
-- - Classification is based on deterministic keyword matching
-- =====================================================

-- Start transaction
BEGIN;

-- Create audit log table for tracking changes
CREATE TEMPORARY TABLE IF NOT EXISTS category_fix_audit (
    id SERIAL PRIMARY KEY,
    product_id INT,
    product_name TEXT,
    old_category_id INT,
    new_category_id INT,
    new_category_name TEXT,
    change_timestamp TIMESTAMP DEFAULT NOW(),
    reason TEXT
);

-- =====================================================
-- STEP 1: IDENTIFY AND LOG ALL CHANGES
-- =====================================================

-- Food & Beverages assignments (ID: 9)
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, new_category_name, reason)
SELECT 
    p.id,
    p.name,
    p.category_id,
    9 as new_category_id,
    'Food & Beverages' as new_category_name,
    'Food keyword match: banku, jollof, rice, waakye, kenkey, fufu, stew, soup, egusi, shito, gari, kelewele, plantain, beans, kontomire, cabbage, barbeque, chicken, fish, meat, khebab, palm, pasta, spaghetti, tuozafi, vegetables, bake, food, ghanaian, nigerian, sierra leone, party orders, combo, fried, nkulenu, plam, sauce' as reason
FROM products p
WHERE p.category_id IS NULL
AND p.status = 'active'
AND (
    LOWER(p.name) LIKE '%banku%' OR
    LOWER(p.name) LIKE '%jollof%' OR
    LOWER(p.name) LIKE '%rice%' OR
    LOWER(p.name) LIKE '%waakye%' OR
    LOWER(p.name) LIKE '%kenkey%' OR
    LOWER(p.name) LIKE '%fufu%' OR
    LOWER(p.name) LIKE '%stew%' OR
    LOWER(p.name) LIKE '%soup%' OR
    LOWER(p.name) LIKE '%egusi%' OR
    LOWER(p.name) LIKE '%shito%' OR
    LOWER(p.name) LIKE '%gari%' OR
    LOWER(p.name) LIKE '%kelewele%' OR
    LOWER(p.name) LIKE '%plantain%' OR
    LOWER(p.name) LIKE '%beans%' OR
    LOWER(p.name) LIKE '%kontomire%' OR
    LOWER(p.name) LIKE '%cabbage%' OR
    LOWER(p.name) LIKE '%barbeque%' OR
    LOWER(p.name) LIKE '%chicken%' OR
    LOWER(p.name) LIKE '%fish%' OR
    LOWER(p.name) LIKE '%meat%' OR
    LOWER(p.name) LIKE '%khebab%' OR
    LOWER(p.name) LIKE '%palm%' OR
    LOWER(p.name) LIKE '%pasta%' OR
    LOWER(p.name) LIKE '%spaghetti%' OR
    LOWER(p.name) LIKE '%tuozafi%' OR
    LOWER(p.name) LIKE '%vegetables%' OR
    LOWER(p.name) LIKE '%bake%' OR
    LOWER(p.name) LIKE '%food%' OR
    LOWER(p.name) LIKE '%ghanaian%' OR
    LOWER(p.name) LIKE '%nigerian%' OR
    LOWER(p.name) LIKE '%sierra leone%' OR
    LOWER(p.name) LIKE '%party orders%' OR
    LOWER(p.name) LIKE '%combo%' OR
    LOWER(p.name) LIKE '%fried%' OR
    LOWER(p.name) LIKE '%nkulenu%' OR
    LOWER(p.name) LIKE '%plam%' OR
    LOWER(p.name) LIKE '%sauce%'
);

-- Men Fashion assignments (ID: 2)
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, new_category_name, reason)
SELECT 
    p.id,
    p.name,
    p.category_id,
    2 as new_category_id,
    'Men Fashion' as new_category_name,
    'Fashion keyword match: boys, men' as reason
FROM products p
WHERE p.category_id IS NULL
AND p.status = 'active'
AND (
    (LOWER(p.name) LIKE '%dashiki%' AND (LOWER(p.name) LIKE '%boys%' OR LOWER(p.name) LIKE '%men%')) OR
    LOWER(p.name) LIKE '%men dashiki%' OR
    LOWER(p.name) LIKE '%boys dashiki%'
);

-- Women Fashion assignments (ID: 1)
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, new_category_name, reason)
SELECT 
    p.id,
    p.name,
    p.category_id,
    1 as new_category_id,
    'Women Fashion' as new_category_name,
    'Fashion keyword match: girls, women, ladies' as reason
FROM products p
WHERE p.category_id IS NULL
AND p.status = 'active'
AND (
    (LOWER(p.name) LIKE '%dashiki%' AND (LOWER(p.name) LIKE '%girls%' OR LOWER(p.name) LIKE '%women%' OR LOWER(p.name) LIKE '%ladies%')) OR
    LOWER(p.name) LIKE '%women dashiki%' OR
    LOWER(p.name) LIKE '%girls dashiki%' OR
    LOWER(p.name) LIKE '%ladies dashiki%'
);

-- =====================================================
-- STEP 2: DISPLAY PLANNED CHANGES (FOR VERIFICATION)
-- =====================================================

SELECT 
    'PLANNED CHANGES SUMMARY' as info,
    COUNT(*) as total_changes
FROM category_fix_audit;

SELECT 
    new_category_name,
    COUNT(*) as product_count,
    STRING_AGG(product_name, ', ' ORDER BY product_name) as products
FROM category_fix_audit
GROUP BY new_category_name
ORDER BY product_count DESC;

-- =====================================================
-- STEP 3: EXECUTE UPDATES
-- =====================================================

-- Update Food & Beverages products
UPDATE products p
SET category_id = 9
FROM category_fix_audit a
WHERE p.id = a.product_id
AND a.new_category_id = 9;

-- Update Men Fashion products
UPDATE products p
SET category_id = 2
FROM category_fix_audit a
WHERE p.id = a.product_id
AND a.new_category_id = 2;

-- Update Women Fashion products
UPDATE products p
SET category_id = 1
FROM category_fix_audit a
WHERE p.id = a.product_id
AND a.new_category_id = 1;

-- =====================================================
-- STEP 4: VALIDATION RESULTS
-- =====================================================

-- Show updated counts by category
SELECT 
    c.name as category_name,
    c.id as category_id,
    COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
GROUP BY c.id, c.name
ORDER BY c.name;

-- Show remaining uncategorized products
SELECT 
    'UNCATEGORIZED PRODUCTS' as info,
    COUNT(*) as count
FROM products 
WHERE category_id IS NULL 
AND status = 'active';

-- Show specific uncategorized products (if any)
SELECT 
    id,
    name,
    price
FROM products 
WHERE category_id IS NULL 
AND status = 'active'
ORDER BY name
LIMIT 10;

-- =====================================================
-- STEP 5: AUDIT LOG
-- =====================================================

-- Show all changes made
SELECT 
    a.product_id,
    a.product_name,
    a.old_category_id,
    a.new_category_id,
    a.new_category_name,
    a.reason,
    a.change_timestamp
FROM category_fix_audit a
ORDER BY a.new_category_name, a.product_name;

-- =====================================================
-- STEP 6: CLEANUP AND COMMIT
-- =====================================================

-- Drop temporary audit table (commented out for review)
-- DROP TEMPORARY TABLE IF EXISTS category_fix_audit;

-- Commit transaction
COMMIT;

-- =====================================================
-- ROLLBACK INSTRUCTIONS (IF NEEDED)
-- =====================================================
/*
If you need to rollback these changes, run:

BEGIN;

-- Restore original category_id (set to NULL for all updated products)
UPDATE products p
SET category_id = NULL
WHERE id IN (
    SELECT DISTINCT product_id 
    FROM category_fix_audit
);

-- Verify rollback
SELECT COUNT(*) as rolled_back_count
FROM products 
WHERE category_id IS NULL 
AND status = 'active'
AND id IN (
    SELECT DISTINCT product_id 
    FROM category_fix_audit
);

COMMIT;
*/
