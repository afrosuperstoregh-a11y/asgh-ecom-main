-- AfroSuperStore Real Products Setup
-- This script sets up the required categories and inserts real products

-- Clear existing mock data
DELETE FROM order_items;
DELETE FROM cart;
DELETE FROM inventory_logs;
DELETE FROM reviews;
DELETE FROM payments;
DELETE FROM orders;
DELETE FROM products;
DELETE FROM categories;

-- Insert required categories
INSERT INTO categories (name, slug, description, sort_order, is_active) VALUES 
('Women Fashion', 'women-fashion', 'Latest women''s fashion and clothing', 1, true),
('Men Fashion', 'men-fashion', 'Latest men''s fashion and clothing', 2, true),
('Food', 'food', 'Authentic African food products', 3, true)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- Get category IDs for products
DO $$
DECLARE
  women_fashion_id UUID;
  men_fashion_id UUID;
  food_id UUID;
BEGIN
  SELECT id INTO women_fashion_id FROM categories WHERE slug = 'women-fashion';
  SELECT id INTO men_fashion_id FROM categories WHERE slug = 'men-fashion';
  SELECT id INTO food_id FROM categories WHERE slug = 'food';
  
  -- Insert Women Fashion Product: Girls Dashiki
  INSERT INTO products (
    name, slug, description, short_description, sku, price, 
    category_id, inventory_quantity, status, images, tags,
    track_inventory, allow_backorder, requires_shipping, is_digital,
    featured, created_at, updated_at
  ) VALUES (
    'Girls Dashiki',
    'girls-dashiki',
    'Latest style ladies Dashiki dress made with premium fabric and traditional African patterns.',
    'Latest style ladies Dashiki dress.',
    '100206',
    30.00,
    women_fashion_id,
    50,
    'active',
    '["https://your-supabase-project.supabase.co/storage/v1/object/public/product-images/girls-dashiki.jpg"]',
    '["dashiki", "women", "traditional", "african"]',
    true,
    false,
    true,
    false,
    false,
    NOW(),
    NOW()
  );
  
  -- Insert Men Fashion Product: Boys Dashiki
  INSERT INTO products (
    name, slug, description, short_description, sku, price, 
    category_id, inventory_quantity, status, images, tags,
    track_inventory, allow_backorder, requires_shipping, is_digital,
    featured, created_at, updated_at
  ) VALUES (
    'Boys Dashiki',
    'boys-dashiki',
    'Latest style boys Dashiki dress made with premium fabric and traditional African patterns.',
    'Latest style boys Dashiki dress.',
    '100207',
    30.00,
    men_fashion_id,
    50,
    'active',
    '["https://your-supabase-project.supabase.co/storage/v1/object/public/product-images/boys-dashiki.jpg"]',
    '["dashiki", "men", "traditional", "african"]',
    true,
    false,
    true,
    false,
    false,
    NOW(),
    NOW()
  );
  
  -- Insert Food Product: Banku Flour
  INSERT INTO products (
    name, slug, description, short_description, sku, price, 
    category_id, inventory_quantity, status, images, tags,
    track_inventory, allow_backorder, requires_shipping, is_digital,
    featured, created_at, updated_at
  ) VALUES (
    'Banku Flour',
    'banku-flour',
    'Premium quality fermented banku flour made from maize and cassava. Perfect for preparing traditional Ghanaian banku.',
    'Premium quality fermented banku flour.',
    '100201',
    50.00,
    food_id,
    100,
    'active',
    '["https://your-supabase-project.supabase.co/storage/v1/object/public/product-images/banku-flour.jpg"]',
    '["banku", "flour", "fermented", "ghanaian", "food"]',
    true,
    false,
    true,
    false,
    false,
    NOW(),
    NOW()
  );
  
  -- Insert Food Product: Banku Mix
  INSERT INTO products (
    name, slug, description, short_description, sku, price, 
    category_id, inventory_quantity, status, images, tags,
    track_inventory, allow_backorder, requires_shipping, is_digital,
    featured, created_at, updated_at
  ) VALUES (
    'Banku Mix',
    'banku-mix',
    'High quality banku mix powder with hygienic preparation. Easy to prepare and consistently great taste.',
    'High Quality Banku Mix Powder.',
    '100202',
    40.00,
    food_id,
    100,
    'active',
    '["https://your-supabase-project.supabase.co/storage/v1/object/public/product-images/banku-mix.jpg"]',
    '["banku", "mix", "powder", "ghanaian", "food"]',
    true,
    false,
    true,
    false,
    false,
    NOW(),
    NOW()
  );
  
  -- Insert Food Product: Barbeque
  INSERT INTO products (
    name, slug, description, short_description, sku, price, 
    category_id, inventory_quantity, status, images, tags,
    track_inventory, allow_backorder, requires_shipping, is_digital,
    featured, created_at, updated_at
  ) VALUES (
    'Barbeque',
    'barbeque',
    'Delicious grilled barbeque skewers available in cow, goat, and chicken varieties. Perfectly seasoned and grilled to perfection.',
    'Delicious grilled barbeque skewers.',
    '100203',
    3.00,
    food_id,
    200,
    'active',
    '["https://your-supabase-project.supabase.co/storage/v1/object/public/product-images/barbeque.jpg"]',
    '["barbeque", "grilled", "meat", "skewers", "food"]',
    true,
    false,
    true,
    false,
    false,
    NOW(),
    NOW()
  );
END $$;

-- Verify insertion
SELECT 
  c.name as category_name,
  p.name as product_name,
  p.sku,
  p.price,
  p.inventory_quantity,
  p.status
FROM products p
JOIN categories c ON p.category_id = c.id
ORDER BY c.name, p.name;
