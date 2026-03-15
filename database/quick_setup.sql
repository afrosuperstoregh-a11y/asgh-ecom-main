-- Quick Database Setup Script for Afro Superstore
-- Run this in Supabase SQL Editor to set up basic tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    product_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    sku VARCHAR(100) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    weight DECIMAL(8,2),
    dimensions VARCHAR(100),
    category_id UUID REFERENCES categories(id),
    images TEXT[] DEFAULT '{}',
    videos TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    inventory_quantity INTEGER DEFAULT 0,
    track_inventory BOOLEAN DEFAULT true,
    allow_backorder BOOLEAN DEFAULT false,
    requires_shipping BOOLEAN DEFAULT true,
    is_digital BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active',
    featured BOOLEAN DEFAULT false,
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample categories
INSERT INTO categories (name, slug, description, image_url, sort_order) VALUES
('Women Fashion', 'women-fashion', 'Fashion and accessories for women', 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/women-fashion.svg', 1),
('Men Fashion', 'men-fashion', 'Fashion and accessories for men', 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/men-fashion.svg', 2),
('Food & Groceries', 'food-groceries', 'Authentic African food products and groceries', 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/food-groceries.svg', 3),
('Home & Living', 'home-living', 'Home decor and lifestyle products', 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/home-living.svg', 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, slug, sku, price, compare_price, description, category_id, images, inventory_quantity, featured) VALUES
('Premium African Headwrap', 'premium-african-headwrap', 'PAH001', 29.99, 39.99, 'Beautiful handcrafted African headwrap made from premium quality fabric', (SELECT id FROM categories WHERE slug = 'women-fashion'), ARRAY['https://images.unsplash.com/photo-1572564203219-8d5e4b3bb5f?w=800'], 15, true),
('Handcrafted Leather Bag', 'handcrafted-leather-bag', 'HLB002', 89.99, 119.99, 'Genuine leather handbag with traditional African designs', (SELECT id FROM categories WHERE slug = 'women-fashion'), ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64b631?w=800'], 8, true),
('Traditional Dashiki Shirt', 'traditional-dashiki-shirt', 'TDS003', 45.99, 59.99, 'Colorful traditional African dashiki shirt for men', (SELECT id FROM categories WHERE slug = 'men-fashion'), ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64b631?w=800'], 12, true),
('African Spice Mix', 'african-spice-mix', 'ASM004', 12.99, 15.99, 'Authentic blend of African spices perfect for traditional dishes', (SELECT id FROM categories WHERE slug = 'food-groceries'), ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64b631?w=800'], 25, false)
ON CONFLICT (sku) DO NOTHING;

-- Update category product counts
UPDATE categories SET product_count = (
    SELECT COUNT(*) FROM products WHERE category_id = categories.id AND status = 'active'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow read access to everyone)
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (status = 'active');

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Sample data inserted: % categories, % products', 
        (SELECT COUNT(*) FROM categories), 
        (SELECT COUNT(*) FROM products);
END $$;
