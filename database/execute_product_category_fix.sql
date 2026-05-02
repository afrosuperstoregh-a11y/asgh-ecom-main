-- =====================================================
-- PRODUCT CATEGORY FIX - GENERATED SQL
-- =====================================================
-- Generated on: 2026-05-02T23:14:41.180Z
-- Total products to update: 57

-- Start transaction
BEGIN;

-- Create audit table
CREATE TEMPORARY TABLE IF NOT EXISTS category_fix_audit (
    product_id INT,
    product_name TEXT,
    old_category_id INT,
    new_category_id INT,
    category_name TEXT,
    update_time TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- FOOD & BEVERAGES UPDATES (55 products)
-- =====================================================

-- Update: All Ghanaian Foods Party Orders 1
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (99, 'All Ghanaian Foods Party Orders 1', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 99;

-- Update: All Ghanaian Foods Party Orders 2
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (100, 'All Ghanaian Foods Party Orders 2', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 100;

-- Update: All Ghanaian Foods Party Orders 3
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (101, 'All Ghanaian Foods Party Orders 3', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 101;

-- Update: Banku Flour
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (102, 'Banku Flour', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 102;

-- Update: Banku Mix
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (103, 'Banku Mix', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 103;

-- Update: Banku With Tilapia 1
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (104, 'Banku With Tilapia 1', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 104;

-- Update: Banku With Tilapia 2
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (105, 'Banku With Tilapia 2', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 105;

-- Update: Banku With Tilapia 3
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (106, 'Banku With Tilapia 3', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 106;

-- Update: Banku With Tilapia 4
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (107, 'Banku With Tilapia 4', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 107;

-- Update: Banku&Okro Stew With Meat 1
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (108, 'Banku&Okro Stew With Meat 1', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 108;

-- Update: Banku&Okro Stew With Meat 2
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (109, 'Banku&Okro Stew With Meat 2', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 109;

-- Update: Banku&Okro Stew With Meat 3
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (110, 'Banku&Okro Stew With Meat 3', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 110;

-- Update: Banku&Okro Stew With Meat 4
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (111, 'Banku&Okro Stew With Meat 4', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 111;

-- Update: Barbeque
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (112, 'Barbeque', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 112;

-- Update: Beans Stew With Platain 1
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (113, 'Beans Stew With Platain 1', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 113;

-- Update: Beans Stew With Platain 2
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (114, 'Beans Stew With Platain 2', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 114;

-- Update: Beans Stew With Platain 3
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (115, 'Beans Stew With Platain 3', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 115;

-- Update: Cabbage Stew
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (116, 'Cabbage Stew', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 116;

-- Update: Chicken
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (119, 'Chicken', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 119;

-- Update: Chicken Wings Ghanaian Style
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (118, 'Chicken Wings Ghanaian Style', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 118;

-- Update: Chicken Wings Ghanaian Style 2
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (117, 'Chicken Wings Ghanaian Style 2', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 117;

-- Update: Different Stew Party Orders 1
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (120, 'Different Stew Party Orders 1', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 120;

-- Update: Different Stew Party Orders 2
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (121, 'Different Stew Party Orders 2', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 121;

-- Update: Different Stew Party Orders 3
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (122, 'Different Stew Party Orders 3', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 122;

-- Update: Different Stew Party Orders 4
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (123, 'Different Stew Party Orders 4', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 123;

-- Update: Fried Fish
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (125, 'Fried Fish', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 125;

-- Update: Fried Fish 2
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (124, 'Fried Fish 2', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 124;

-- Update: Fried Rice And Chicken
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (126, 'Fried Rice And Chicken', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 126;

-- Update: Fried Rice With Chicken Combo
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (130, 'Fried Rice With Chicken Combo', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 130;

-- Update: Fried Rice With Chicken Combo 2
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (127, 'Fried Rice With Chicken Combo 2', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 127;

-- Update: Fried Rice With Chicken Combo 3
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (128, 'Fried Rice With Chicken Combo 3', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 128;

-- Update: Fried Rice With Chicken Combo 4
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (129, 'Fried Rice With Chicken Combo 4', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 129;

-- Update: Ghana Nkulenu Plam Sauce
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (131, 'Ghana Nkulenu Plam Sauce', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 131;

-- Update: Jollof Combo
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (132, 'Jollof Combo', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 132;

-- Update: Jollof Rice
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (133, 'Jollof Rice', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 133;

-- Update: Jolof Rice, Plaintain Vegetables & Chicken
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (134, 'Jolof Rice, Plaintain Vegetables & Chicken', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 134;

-- Update: Kenkey
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (135, 'Kenkey', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 135;

-- Update: Khebab 1
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (136, 'Khebab 1', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 136;

-- Update: Khebab 2
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (137, 'Khebab 2', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 137;

-- Update: Kontomire Stew
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (138, 'Kontomire Stew', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 138;

-- Update: Meat Pie
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (139, 'Meat Pie', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 139;

-- Update: Neat Fufu
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (140, 'Neat Fufu', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 140;

-- Update: Nigerian Egusi Stew
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (141, 'Nigerian Egusi Stew', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 141;

-- Update: Palm Oil
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (142, 'Palm Oil', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 142;

-- Update: Pasta
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (143, 'Pasta', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 143;

-- Update: Rice With Green Pea
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (144, 'Rice With Green Pea', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 144;

-- Update: Sierra Leone Food
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (145, 'Sierra Leone Food', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 145;

-- Update: Spaghetti
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (146, 'Spaghetti', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 146;

-- Update: Stew
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (147, 'Stew', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 147;

-- Update: Tuozafi
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (149, 'Tuozafi', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 149;

-- Update: Tuozafi 2
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (148, 'Tuozafi 2', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 148;

-- Update: Vegetables&Bake Beans
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (150, 'Vegetables&Bake Beans', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 150;

-- Update: Waakye
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (153, 'Waakye', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 153;

-- Update: Waakye With Fish Combo 1
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (151, 'Waakye With Fish Combo 1', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 151;

-- Update: Waakye With Fish Combo 2
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (152, 'Waakye With Fish Combo 2', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = 152;

-- =====================================================
-- MEN FASHION UPDATES (1 products)
-- =====================================================

-- Update: Boys Dashiki
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (7, 'Boys Dashiki', NULL, 2, 'Men Fashion');

UPDATE products 
SET category_id = 2 
WHERE id = 7;

-- =====================================================
-- WOMEN FASHION UPDATES (1 products)
-- =====================================================

-- Update: Girls Dashiki
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (6, 'Girls Dashiki', NULL, 1, 'Women Fashion');

UPDATE products 
SET category_id = 1 
WHERE id = 6;

-- =====================================================
-- VALIDATION QUERIES
-- =====================================================

-- Show audit log
SELECT 
    category_name,
    COUNT(*) as updated_count,
    STRING_AGG(product_name, ', ' ORDER BY product_name) as products
FROM category_fix_audit 
GROUP BY category_name
ORDER BY updated_count DESC;

-- Show remaining uncategorized products
SELECT 
    'UNCATEGORIZED REMAINING' as status,
    COUNT(*) as count
FROM products 
WHERE category_id IS NULL 
AND status = 'active';

-- Show updated category counts
SELECT 
    c.name as category_name,
    c.id as category_id,
    COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
GROUP BY c.id, c.name
ORDER BY c.name;

-- Commit transaction
COMMIT;

-- =====================================================
-- EXECUTION INSTRUCTIONS
-- =====================================================
-- 1. Run this SQL script in Supabase SQL Editor
-- 2. Review the audit log output
-- 3. Verify all products are categorized
-- 4. If issues occur, run rollback script below

-- =====================================================
-- ROLLBACK SCRIPT (IF NEEDED)
-- =====================================================
/*
BEGIN;

-- Restore all updated products to uncategorized
UPDATE products 
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
