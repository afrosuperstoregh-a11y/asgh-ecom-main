-- Migration 003: Add slug indexes and backfill missing slugs
-- This migration ensures proper slug-based routing functionality

-- Add indexes for slug fields if they don't exist
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Backfill missing slugs for products
UPDATE products 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-'))
WHERE slug IS NULL OR slug = '';

-- Ensure unique slugs for products by appending numbers if needed
DO $$
DECLARE
    product_record RECORD;
    counter INTEGER := 1;
    base_slug TEXT;
    new_slug TEXT;
BEGIN
    FOR product_record IN 
        SELECT id, name, slug FROM products 
        WHERE slug IS NOT NULL 
        ORDER BY id
    LOOP
        base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(product_record.name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-'));
        
        -- Check if slug is unique
        WHILE EXISTS (
            SELECT 1 FROM products 
            WHERE slug = base_slug AND id != product_record.id
        ) LOOP
            new_slug := base_slug || '-' || counter;
            counter := counter + 1;
            
            -- Check if new slug is unique
            IF NOT EXISTS (
                SELECT 1 FROM products 
                WHERE slug = new_slug AND id != product_record.id
            ) THEN
                UPDATE products SET slug = new_slug WHERE id = product_record.id;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Backfill missing slugs for categories
UPDATE categories 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-'))
WHERE slug IS NULL OR slug = '';

-- Ensure unique slugs for categories by appending numbers if needed
DO $$
DECLARE
    category_record RECORD;
    counter INTEGER := 1;
    base_slug TEXT;
    new_slug TEXT;
BEGIN
    FOR category_record IN 
        SELECT id, name, slug FROM categories 
        WHERE slug IS NOT NULL 
        ORDER BY id
    LOOP
        base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(category_record.name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-'));
        
        -- Check if slug is unique
        WHILE EXISTS (
            SELECT 1 FROM categories 
            WHERE slug = base_slug AND id != category_record.id
        ) LOOP
            new_slug := base_slug || '-' || counter;
            counter := counter + 1;
            
            -- Check if new slug is unique
            IF NOT EXISTS (
                SELECT 1 FROM categories 
                WHERE slug = new_slug AND id != category_record.id
            ) THEN
                UPDATE categories SET slug = new_slug WHERE id = category_record.id;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Add comments to document the migration
COMMENT ON INDEX idx_products_slug IS 'Index for product slug-based lookups';
COMMENT ON INDEX idx_categories_slug IS 'Index for category slug-based lookups';
