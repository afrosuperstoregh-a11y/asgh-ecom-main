-- AfroSuperStore Migration: Add Performance Indexes
-- Version: 002
-- Created: 2026-01-16

\c afrosuperstore;

-- Add full-text search index for products
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status);
CREATE INDEX IF NOT EXISTS idx_products_brand_status ON products(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_products_price_range ON products(price) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);

-- Add partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON products(id) WHERE status = 'active' AND featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_orders_recent ON orders(created_at DESC) WHERE status IN ('confirmed', 'processing', 'shipped');

-- Record this migration
INSERT INTO migrations (version, executed_at) VALUES ('002_add_indexes', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
