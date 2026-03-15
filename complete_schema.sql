-- Afro Superstore E-Commerce Platform - Complete SQL Schema
-- PostgreSQL with Supabase Authentication Integration
-- Generated from migration files on March 13, 2026

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- AUTHENTICATION & USER MANAGEMENT
-- ============================================================================

-- Primary users table (legacy - being migrated to Supabase auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin', 'vendor')),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table for additional admin-specific data
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Supabase Auth Integration - Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
    email_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- ============================================================================
-- PRODUCT CATALOG
-- ============================================================================

-- Categories table (hierarchical structure)
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
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
    dimensions VARCHAR(50),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    images JSONB DEFAULT '[]',
    videos JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    inventory_quantity INTEGER DEFAULT 0,
    track_inventory BOOLEAN DEFAULT TRUE,
    allow_backorder BOOLEAN DEFAULT FALSE,
    requires_shipping BOOLEAN DEFAULT TRUE,
    is_digital BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
    featured BOOLEAN DEFAULT FALSE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ORDERS & PAYMENTS
-- ============================================================================

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    email VARCHAR(255) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    currency VARCHAR(3) DEFAULT 'USD',
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    payment_intent_id VARCHAR(255),
    shipping_address JSONB,
    billing_address JSONB,
    notes TEXT,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'cash_on_delivery')),
    payment_intent_id VARCHAR(255),
    gateway_response JSONB,
    failure_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SHOPPING CART
-- ============================================================================

-- Shopping cart table
CREATE TABLE IF NOT EXISTS cart (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, product_id),
    UNIQUE(session_id, product_id)
);

-- ============================================================================
-- CUSTOMER RELATIONSHIP MANAGEMENT (CRM)
-- ============================================================================

-- Customer Profiles (extends existing users table)
CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lifecycle_stage TEXT DEFAULT 'lead' CHECK (lifecycle_stage IN ('lead', 'active', 'inactive', 'vip', 'churned')),
    total_spend DECIMAL(12,2) DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    last_order_date TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    average_order_value DECIMAL(10,2) DEFAULT 0,
    lifetime_value DECIMAL(12,2) DEFAULT 0,
    preferred_language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    marketing_consent BOOLEAN DEFAULT true,
    sms_consent BOOLEAN DEFAULT false,
    data_retention_days INTEGER DEFAULT 2555,
    soft_deleted BOOLEAN DEFAULT false,
    soft_deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Customer Notes (internal admin notes)
CREATE TABLE IF NOT EXISTS customer_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'support', 'sales', 'risk', 'complaint')),
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Tags
CREATE TABLE IF NOT EXISTS customer_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6B7280',
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Tag Mapping
CREATE TABLE IF NOT EXISTS customer_tag_map (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, tag_id)
);

-- Customer Segments
CREATE TABLE IF NOT EXISTS customer_segments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_dynamic BOOLEAN DEFAULT false,
    customer_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Segment Rules (for dynamic segments)
CREATE TABLE IF NOT EXISTS customer_segment_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    segment_id UUID NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
    field TEXT NOT NULL,
    operator TEXT NOT NULL CHECK (operator IN ('=', '!=', '>', '>=', '<', '<=', 'in', 'not_in', 'contains', 'like')),
    value TEXT NOT NULL,
    condition_type TEXT DEFAULT 'and' CHECK (condition_type IN ('and', 'or')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Segment Membership
CREATE TABLE IF NOT EXISTS customer_segment_memberships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    segment_id UUID NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, segment_id)
);

-- ============================================================================
-- EMAIL MARKETING & COMMUNICATIONS
-- ============================================================================

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    template_type TEXT NOT NULL CHECK (template_type IN ('transactional', 'marketing', 'notification')),
    category TEXT,
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Logs
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
    provider TEXT NOT NULL,
    provider_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    segment_id UUID REFERENCES customer_segments(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Recipients
CREATE TABLE IF NOT EXISTS email_campaign_recipients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, customer_id)
);

-- ============================================================================
-- CRM AUTOMATION
-- ============================================================================

-- CRM Automations
CREATE TABLE IF NOT EXISTS crm_automations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('order_placed', 'order_shipped', 'customer_inactive', 'customer_signup', 'segment_changed', 'custom')),
    trigger_config JSONB,
    actions JSONB NOT NULL,
    run_count INTEGER DEFAULT 0,
    last_run_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Automation Logs
CREATE TABLE IF NOT EXISTS crm_automation_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    automation_id UUID NOT NULL REFERENCES crm_automations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
    trigger_data JSONB,
    actions_executed JSONB,
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INVENTORY & REVIEWS
-- ============================================================================

-- Inventory logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('sale', 'restock', 'adjustment', 'return')),
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    verified_purchase BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User and authentication indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);

-- Product catalog indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_videos ON products USING GIN (videos);

-- Order and payment indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Shopping cart indexes
CREATE INDEX IF NOT EXISTS idx_cart_customer ON cart(customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_session ON cart(session_id);

-- Review and inventory indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_order ON inventory_logs(order_id);

-- CRM indexes
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_lifecycle_stage ON customer_profiles(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_total_spend ON customer_profiles(total_spend);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_last_order_date ON customer_profiles(last_order_date);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_last_activity ON customer_profiles(last_activity);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_soft_deleted ON customer_profiles(soft_deleted);

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_admin_id ON customer_notes(admin_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created_at ON customer_notes(created_at);

CREATE INDEX IF NOT EXISTS idx_customer_tags_name ON customer_tags(name);
CREATE INDEX IF NOT EXISTS idx_customer_tags_is_system ON customer_tags(is_system);

CREATE INDEX IF NOT EXISTS idx_customer_tag_map_customer_id ON customer_tag_map(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_tag_map_tag_id ON customer_tag_map(tag_id);

CREATE INDEX IF NOT EXISTS idx_customer_segments_is_active ON customer_segments(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_segments_is_dynamic ON customer_segments(is_dynamic);
CREATE INDEX IF NOT EXISTS idx_customer_segments_created_by ON customer_segments(created_by);

CREATE INDEX IF NOT EXISTS idx_customer_segment_rules_segment_id ON customer_segment_rules(segment_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_rules_field ON customer_segment_rules(field);

CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_customer_id ON customer_segment_memberships(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_segment_id ON customer_segment_memberships(segment_id);

-- Email marketing indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_template_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_email_logs_customer_id ON email_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_provider ON email_logs(provider);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_segment_id ON email_campaigns(segment_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON email_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_campaign_id ON email_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_customer_id ON email_campaign_recipients(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_status ON email_campaign_recipients(status);

-- CRM automation indexes
CREATE INDEX IF NOT EXISTS idx_crm_automations_is_active ON crm_automations(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_automations_trigger_type ON crm_automations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_crm_automations_created_by ON crm_automations(created_by);

CREATE INDEX IF NOT EXISTS idx_crm_automation_logs_automation_id ON crm_automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_crm_automation_logs_customer_id ON crm_automation_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_automation_logs_created_at ON crm_automation_logs(created_at);

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Full-text search index for products
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(short_description, '')));

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at on all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON cart FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_notes_updated_at BEFORE UPDATE ON customer_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_tags_updated_at BEFORE UPDATE ON customer_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON email_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_automations_updated_at BEFORE UPDATE ON crm_automations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Combined user data view (Supabase auth + profiles)
CREATE OR REPLACE VIEW users_with_profile AS
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at as auth_created_at,
    u.last_sign_in_at,
    p.first_name,
    p.last_name,
    p.phone,
    p.role,
    p.email_verified,
    p.created_at,
    p.updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id;

-- Customer analytics view
CREATE OR REPLACE VIEW customer_analytics AS
SELECT 
    cp.id as customer_profile_id,
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.phone,
    cp.lifecycle_stage,
    cp.total_spend,
    cp.order_count,
    cp.last_order_date,
    cp.last_activity,
    cp.average_order_value,
    cp.lifetime_value,
    cp.created_at as customer_since,
    CASE 
        WHEN cp.last_order_date IS NULL THEN 999
        ELSE EXTRACT(DAYS FROM NOW() - cp.last_order_date)::INTEGER
    END as days_since_last_order,
    CASE 
        WHEN cp.created_at IS NULL THEN 0
        ELSE ROUND((cp.order_count::DECIMAL / GREATEST(EXTRACT(DAYS FROM NOW() - cp.created_at)::INTEGER, 1)) * 30, 2)
    END as orders_per_month,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'segment_id', csm.segment_id,
                'segment_name', cs.name,
                'added_at', csm.added_at
            )
        ) FILTER (WHERE csm.segment_id IS NOT NULL),
        '[]'::json
    ) as segments,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'tag_id', ct.id,
                'tag_name', ct.name,
                'tag_color', ct.color,
                'assigned_at', ctm.assigned_at
            )
        ) FILTER (WHERE ct.id IS NOT NULL),
        '[]'::json
    ) as tags
FROM customer_profiles cp
JOIN users u ON cp.user_id = u.id
LEFT JOIN customer_segment_memberships csm ON cp.id = csm.customer_id
LEFT JOIN customer_segments cs ON csm.segment_id = cs.id
LEFT JOIN customer_tag_map ctm ON cp.id = ctm.customer_id
LEFT JOIN customer_tags ct ON ctm.tag_id = ct.id
WHERE cp.soft_deleted = false
GROUP BY cp.id, u.id, u.email, u.first_name, u.last_name, u.phone, cp.lifecycle_stage, cp.total_spend, cp.order_count, cp.last_order_date, cp.last_activity, cp.average_order_value, cp.lifetime_value, cp.created_at;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE profiles IS 'Extended user profile data linked to Supabase auth.users';
COMMENT ON COLUMN profiles.user_id IS 'Reference to auth.users.id';
COMMENT ON COLUMN profiles.role IS 'User role: customer, admin, or super_admin';
COMMENT ON COLUMN profiles.email_verified IS 'Mirrors auth.users.email_confirmed_at';
COMMENT ON VIEW users_with_profile IS 'Combined view of auth.users and profiles data';
COMMENT ON TABLE products.videos IS 'Array of video URLs for product demonstrations';
COMMENT ON VIEW customer_analytics IS 'Comprehensive customer analytics with segments and tags';

-- ============================================================================
-- SAMPLE DATA (Optional)
-- ============================================================================

-- Sample categories (can be removed in production)
INSERT INTO categories (name, slug, description, sort_order) VALUES 
('Clothing', 'clothing', 'Afrocentric clothing and apparel', 1),
('Accessories', 'accessories', 'Fashion accessories and jewelry', 2),
('Home & Living', 'home-living', 'Home decor and lifestyle products', 3),
('Art & Crafts', 'art-crafts', 'Traditional and contemporary art pieces', 4)
ON CONFLICT (slug) DO NOTHING;

-- Sample customer tags
INSERT INTO customer_tags (name, color, description, is_system) VALUES 
('VIP', '#FFD700', 'High-value customer with special privileges', true),
('Wholesale', '#8B4513', 'Business customer with wholesale pricing', true),
('Abandoned Cart', '#FF6B6B', 'Customer with abandoned cart items', true),
('High Risk', '#DC143C', 'Customer with payment or fraud issues', true),
('New Customer', '#32CD32', 'Recently registered customer', true),
('Repeat Customer', '#4169E1', 'Customer with multiple purchases', true),
('Inactive', '#808080', 'Customer with no recent activity', true),
('Premium', '#9370DB', 'Premium tier customer', true)
ON CONFLICT (name) DO NOTHING;

COMMIT;
