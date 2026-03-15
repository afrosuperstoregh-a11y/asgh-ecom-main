-- Insert sample categories for testing
INSERT INTO categories (name, slug, description, sort_order, is_active) VALUES
('Clothing', 'clothing', 'Afrocentric clothing and apparel', 1, true),
('Accessories', 'accessories', 'Fashion accessories and jewelry', 2, true),
('Home & Living', 'home-living', 'Home decor and lifestyle products', 3, true),
('Art & Crafts', 'art-crafts', 'Traditional and contemporary art pieces', 4, true),
('Beauty & Health', 'beauty-health', 'Natural beauty and health products', 5, true),
('Food & Beverages', 'food-beverages', 'Authentic African food and beverages', 6, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;
