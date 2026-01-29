-- Create features table for the feature collector system
-- This table stores dynamic feature definitions for products, categories, promotions, and customers

CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL, -- product, category, promotion, customer
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'string', -- string, number, boolean, datetime, url, text, select
    required BOOLEAN DEFAULT false,
    default_value TEXT,
    validation_rules JSONB DEFAULT '{}',
    options JSONB DEFAULT '[]', -- For select type features
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of category and name
    UNIQUE(category, name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_features_category ON features(category);
CREATE INDEX IF NOT EXISTS idx_features_active ON features(is_active);
CREATE INDEX IF NOT EXISTS idx_features_type ON features(type);

-- Create feature_values table to store actual feature values for entities
CREATE TABLE IF NOT EXISTS feature_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- product, category, promotion, customer
    entity_id UUID NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of feature and entity
    UNIQUE(feature_id, entity_type, entity_id)
);

-- Create indexes for feature_values
CREATE INDEX IF NOT EXISTS idx_feature_values_feature ON feature_values(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_values_entity ON feature_values(entity_type, entity_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_features_updated_at 
    BEFORE UPDATE ON features 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_values_updated_at 
    BEFORE UPDATE ON feature_values 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default features for products
INSERT INTO features (category, name, type, required, default_value, description) VALUES
-- Product attributes
('product', 'brand', 'string', false, NULL, 'Product brand name'),
('product', 'color', 'select', false, NULL, 'Product color option'),
('product', 'size', 'select', false, NULL, 'Product size option'),
('product', 'material', 'select', false, NULL, 'Product material type'),
('product', 'weight', 'number', false, 0, 'Product weight in kg'),
('product', 'dimensions', 'string', false, NULL, 'Product dimensions (L x W x H)'),
('product', 'warranty', 'string', false, NULL, 'Product warranty information'),
('product', 'origin', 'string', false, NULL, 'Product country of origin'),
('product', 'care_instructions', 'text', false, NULL, 'Product care instructions'),

-- Product pricing
('product', 'base_price', 'number', true, 0, 'Base selling price'),
('product', 'sale_price', 'number', false, NULL, 'Sale price if applicable'),
('product', 'bulk_discount', 'number', false, 0, 'Bulk discount percentage'),
('product', 'member_price', 'number', false, NULL, 'Member exclusive price'),

-- Product inventory
('product', 'stock_quantity', 'number', true, 0, 'Available stock quantity'),
('product', 'low_stock_threshold', 'number', false, 10, 'Low stock alert threshold'),
('product', 'backorder_allowed', 'boolean', false, false, 'Allow backordering'),
('product', 'track_inventory', 'boolean', false, true, 'Track inventory levels'),
('product', 'allow_negative_stock', 'boolean', false, false, 'Allow negative stock levels'),

-- Product shipping
('product', 'shipping_weight', 'number', false, NULL, 'Shipping weight in kg'),
('product', 'shipping_dimensions', 'string', false, NULL, 'Shipping dimensions'),
('product', 'free_shipping', 'boolean', false, false, 'Free shipping eligible'),
('product', 'shipping_class', 'string', false, 'standard', 'Shipping class'),
('product', 'shipping_restrictions', 'text', false, NULL, 'Shipping restrictions'),
('product', 'hazmat', 'boolean', false, false, 'Hazardous material'),

-- Digital products
('product', 'downloadable', 'boolean', false, false, 'Digital downloadable product'),
('product', 'license_key', 'string', false, NULL, 'License key for digital product'),
('product', 'access_duration', 'number', false, NULL, 'Access duration in days'),
('product', 'download_limit', 'number', false, NULL, 'Download limit per customer'),

-- Category features
('category', 'featured_image', 'url', false, NULL, 'Category featured image URL'),
('category', 'banner_image', 'url', false, NULL, 'Category banner image URL'),
('category', 'icon', 'url', false, NULL, 'Category icon URL'),
('category', 'description', 'text', false, NULL, 'Category description'),
('category', 'sort_order', 'number', false, 0, 'Display sort order'),
('category', 'is_featured', 'boolean', false, false, 'Featured category'),
('category', 'meta_title', 'string', false, NULL, 'SEO meta title'),
('category', 'meta_description', 'text', false, NULL, 'SEO meta description'),
('category', 'meta_keywords', 'string', false, NULL, 'SEO meta keywords'),
('category', 'canonical_url', 'url', false, NULL, 'Canonical URL'),
('category', 'parent_category', 'string', false, NULL, 'Parent category'),
('category', 'url_slug', 'string', true, NULL, 'URL slug for category'),
('category', 'redirect_url', 'url', false, NULL, 'Redirect URL if applicable'),

-- Promotion features
('promotion', 'percentage_off', 'number', false, NULL, 'Percentage discount'),
('promotion', 'fixed_amount_off', 'number', false, NULL, 'Fixed amount discount'),
('promotion', 'buy_x_get_y', 'string', false, NULL, 'Buy X get Y offer details'),
('promotion', 'free_shipping', 'boolean', false, false, 'Free shipping promotion'),
('promotion', 'free_gift', 'string', false, NULL, 'Free gift with purchase'),
('promotion', 'minimum_order_value', 'number', false, NULL, 'Minimum order value'),
('promotion', 'product_inclusion', 'text', false, NULL, 'Product inclusion rules'),
('promotion', 'exclusion_rules', 'text', false, NULL, 'Exclusion rules'),
('promotion', 'customer_segment', 'string', false, NULL, 'Target customer segment'),
('promotion', 'usage_limit', 'number', false, NULL, 'Usage limit per customer'),
('promotion', 'start_date', 'datetime', false, NULL, 'Promotion start date'),
('promotion', 'end_date', 'datetime', false, NULL, 'Promotion end date'),
('promotion', 'recurring', 'boolean', false, false, 'Recurring promotion'),
('promotion', 'seasonal', 'string', false, NULL, 'Seasonal promotion type'),

-- Customer features
('customer', 'name', 'string', true, NULL, 'Customer full name'),
('customer', 'email', 'string', true, NULL, 'Customer email address'),
('customer', 'phone', 'string', false, NULL, 'Customer phone number'),
('customer', 'date_of_birth', 'datetime', false, NULL, 'Customer date of birth'),
('customer', 'gender', 'select', false, NULL, 'Customer gender'),
('customer', 'preferences', 'text', false, NULL, 'Customer preferences'),
('customer', 'communication_settings', 'text', false, NULL, 'Communication preferences'),
('customer', 'customer_tier', 'select', false, 'Bronze', 'Customer loyalty tier'),
('customer', 'purchase_history', 'text', false, NULL, 'Purchase history data'),
('customer', 'behavioral_data', 'text', false, NULL, 'Behavioral tracking data'),
('customer', 'location', 'string', false, NULL, 'Customer location'),
('customer', 'demographics', 'text', false, NULL, 'Demographic information'),
('customer', 'points_balance', 'number', false, 0, 'Loyalty points balance'),
('customer', 'tier_level', 'select', false, 'Bronze', 'Current tier level'),
('customer', 'rewards_earned', 'number', false, 0, 'Total rewards earned'),
('customer', 'expiry_dates', 'text', false, NULL, 'Points expiry dates'),
('customer', 'redemption_history', 'text', false, NULL, 'Redemption history')

ON CONFLICT (category, name) DO NOTHING;

-- Create view for feature statistics
CREATE OR REPLACE VIEW feature_stats AS
SELECT 
    category,
    COUNT(*) as total_features,
    COUNT(*) FILTER (WHERE is_active = true) as active_features,
    COUNT(*) FILTER (WHERE required = true) as required_features,
    STRING_AGG(DISTINCT type, ', ') as feature_types
FROM features
GROUP BY category
ORDER BY category;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON features TO authenticated_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON feature_values TO authenticated_user;
-- GRANT SELECT ON feature_stats TO authenticated_user;
