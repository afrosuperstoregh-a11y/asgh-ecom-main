-- Update Database Schema for Supabase Integration
-- Run this script in your Supabase SQL Editor to add missing columns

-- First, let's check the current structure and add missing columns to products table
-- ALTER TABLE products 
-- ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
-- ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
-- ADD COLUMN IF NOT EXISTS slug TEXT,
-- ADD COLUMN IF NOT EXISTS description TEXT,
-- ADD COLUMN IF NOT EXISTS short_description TEXT,
-- ADD COLUMN IF NOT EXISTS compare_price DECIMAL(10,2),
-- ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2),
-- ADD COLUMN IF NOT EXISTS weight DECIMAL(8,2),
-- ADD COLUMN IF NOT EXISTS dimensions VARCHAR(50),
-- ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES users(id) ON DELETE SET NULL,
-- ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]',
-- ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
-- ADD COLUMN IF NOT EXISTS inventory_quantity INTEGER DEFAULT 0,
-- ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT TRUE,
-- ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN DEFAULT FALSE,
-- ADD COLUMN IF NOT EXISTS requires_shipping BOOLEAN DEFAULT TRUE,
-- ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT FALSE,
-- ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255),
-- ADD COLUMN IF NOT EXISTS seo_description TEXT,
-- ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
-- ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update categories table to add missing columns
-- ALTER TABLE categories
-- ADD COLUMN IF NOT EXISTS slug TEXT,
-- ADD COLUMN IF NOT EXISTS description TEXT,
-- ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
-- ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
-- ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
-- ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
-- ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
-- ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create unique constraint for slug if it doesn't exist
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_slug_unique') THEN
--         ALTER TABLE products ADD CONSTRAINT products_slug_unique UNIQUE (slug);
--     END IF;
    
--     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_slug_unique') THEN
--         ALTER TABLE categories ADD CONSTRAINT categories_slug_unique UNIQUE (slug);
--     END IF;
-- END $$;

-- Generate slugs for existing products that don't have them
-- UPDATE products 
-- SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'))
-- WHERE slug IS NULL OR slug = '';

-- UPDATE products 
-- SET slug = REGEXP_REPLACE(slug, '\s+', '-', 'g')
-- WHERE slug IS NOT NULL;

-- Make sure slugs are unique
-- DO $$
-- DECLARE
--     product_record RECORD;
--     counter INTEGER := 1;
-- BEGIN
--     FOR product_record IN SELECT id, name, slug FROM products WHERE slug IS NOT NULL LOOP
--         -- Check if slug is unique
--         WHILE (SELECT COUNT(*) FROM products WHERE slug = product_record.slug AND id != product_record.id) > 0 LOOP
--             product_record.slug := product_record.slug || '-' || counter;
--             counter := counter + 1;
--         END LOOP;
        
--         UPDATE products SET slug = product_record.slug WHERE id = product_record.id;
--         counter := 1;
--     END LOOP;
-- END $$;

-- Generate slugs for existing categories that don't have them
-- UPDATE categories 
-- SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'))
-- WHERE slug IS NULL OR slug = '';

-- UPDATE categories 
-- SET slug = REGEXP_REPLACE(slug, '\s+', '-', 'g')
-- WHERE slug IS NOT NULL;

-- Set default status for existing products
-- UPDATE products SET status = 'active' WHERE status IS NULL OR status = 'draft';

-- Set default featured for existing products
-- UPDATE products SET featured = false WHERE featured IS NULL;

-- Set default is_active for existing categories
-- UPDATE categories SET is_active = true WHERE is_active IS NULL;

-- Create indexes for better performance
-- CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
-- CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
-- CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
-- CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
-- CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
-- CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Create trigger for updated_at (if it doesn't exist)
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- Drop existing triggers if they exist
-- DROP TRIGGER IF EXISTS update_products_updated_at ON products;
-- DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;

-- Create triggers
-- CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Show the updated table structures
-- SELECT 
--     column_name,
--     data_type,
--     is_nullable,
--     column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'products' 
--     AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- SELECT 
--     column_name,
--     data_type,
--     is_nullable,
--     column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'categories' 
--     AND table_schema = 'public'
-- ORDER BY ordinal_position;
