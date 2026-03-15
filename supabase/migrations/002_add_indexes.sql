-- AfroSuperStore Migration: Add Performance Indexes
-- Version: 002
-- Created: 2026-01-16

-- Add full-text search index for products
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status);
CREATE INDEX IF NOT EXISTS idx_products_price_range ON products(price) WHERE status = 'active';

-- Add partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON products(id) WHERE status = 'active' AND featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_orders_recent ON orders(created_at DESC) WHERE status IN ('confirmed', 'processing', 'shipped');
