-- PHASE 3: Schema Standardization - Canonical PostgreSQL Schema
-- Migration: 002_create_canonical_schema.sql
-- Purpose: Create the definitive PostgreSQL/Supabase schema
-- This replaces all previous schema migrations with a single canonical version
--
-- This migration:
-- 1. Removes all MySQL-specific syntax
-- 2. Standardizes on PostgreSQL 17 + Supabase
-- 3. Establishes auth.users + profiles pattern
-- 4. Implements consistent naming conventions
-- 5. Sets up proper foreign keys with consistent ON DELETE behavior

-- BEGIN;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- MIGRATION TRACKING TABLE
-- ============================================================================

-- CREATE TABLE IF NOT EXISTS migration_log (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     migration_name TEXT NOT NULL UNIQUE,
--     executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     execution_time_ms INTEGER,
--     success BOOLEAN NOT NULL DEFAULT true,
--     checksum TEXT,
--     rollback_available BOOLEAN DEFAULT false,
--     rollback_migration_name TEXT
-- );

-- CREATE INDEX IF NOT EXISTS idx_migration_log_executed_at ON migration_log(executed_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_migration_log_success ON migration_log(success);

-- ============================================================================
-- AUTHENTICATION & USER MANAGEMENT
-- ============================================================================

-- Profiles table extends Supabase auth.users
-- CREATE TABLE IF NOT EXISTS profiles (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--     first_name VARCHAR(100),
--     last_name VARCHAR(100),
--     phone VARCHAR(20),
--     role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin', 'vendor')),
--     email_verified BOOLEAN NOT NULL DEFAULT false,
--     avatar_url TEXT,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     deleted_at TIMESTAMPTZ,
--     UNIQUE(user_id)
-- );

-- Admin users table for additional admin-specific data
-- CREATE TABLE IF NOT EXISTS admin_users (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
--     permissions JSONB DEFAULT '{}',
--     last_login TIMESTAMPTZ,
--     login_count INTEGER DEFAULT 0,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     UNIQUE(user_id)
-- );

-- ============================================================================
-- E-COMMERCE CORE TABLES
-- ============================================================================

-- Categories table
-- CREATE TABLE IF NOT EXISTS categories (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name VARCHAR(100) NOT NULL,
--     slug VARCHAR(100) NOT NULL UNIQUE,
--     description TEXT,
--     image_url TEXT,
--     parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
--     sort_order INTEGER DEFAULT 0,
--     is_active BOOLEAN DEFAULT true,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     deleted_at TIMESTAMPTZ
-- );

-- Products table
-- CREATE TABLE IF NOT EXISTS products (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name VARCHAR(255) NOT NULL,
--     slug VARCHAR(255) NOT NULL UNIQUE,
--     description TEXT,
--     short_description TEXT,
--     sku VARCHAR(100) NOT NULL UNIQUE,
--     price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
--     compare_price DECIMAL(10,2) CHECK (compare_price >= 0),
--     cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
--     weight DECIMAL(8,2) CHECK (weight >= 0),
--     dimensions VARCHAR(50),
--     category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
--     vendor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
--     images JSONB DEFAULT '[]',
--     videos JSONB DEFAULT '[]',
--     tags JSONB DEFAULT '[]',
--     inventory_quantity INTEGER DEFAULT 0 CHECK (inventory_quantity >= 0),
--     track_inventory BOOLEAN DEFAULT true,
--     allow_backorder BOOLEAN DEFAULT false,
--     requires_shipping BOOLEAN DEFAULT true,
--     is_digital BOOLEAN DEFAULT false,
--     status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
--     featured BOOLEAN DEFAULT false,
--     seo_title VARCHAR(255),
--     seo_description TEXT,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     deleted_at TIMESTAMPTZ
-- );

-- Orders table
-- CREATE TABLE IF NOT EXISTS orders (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     order_number VARCHAR(50) NOT NULL UNIQUE,
--     user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
--     guest_email TEXT,
--     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
--     currency VARCHAR(3) DEFAULT 'GHS' CHECK (currency ~ '^[A-Z]{3}$'),
--     subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
--     tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
--     shipping_amount DECIMAL(10,2) DEFAULT 0 CHECK (shipping_amount >= 0),
--     total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
--     payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded')),
--     payment_provider TEXT CHECK (payment_provider IN ('stripe', 'paypal', 'paystack', 'bank_transfer', 'cash_on_delivery')),
--     payment_reference TEXT,
--     payment_details JSONB,
--     shipping_address JSONB,
--     billing_address JSONB,
--     notes TEXT,
--     shipped_at TIMESTAMPTZ,
--     delivered_at TIMESTAMPTZ,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     deleted_at TIMESTAMPTZ
-- );

-- Order items table
-- CREATE TABLE IF NOT EXISTS order_items (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
--     product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
--     product_name VARCHAR(255) NOT NULL,
--     product_sku VARCHAR(100) NOT NULL,
--     quantity INTEGER NOT NULL CHECK (quantity > 0),
--     price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
--     total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- Shopping cart table
-- CREATE TABLE IF NOT EXISTS cart (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
--     session_id TEXT,
--     product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
--     quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     UNIQUE(user_id, product_id),
--     UNIQUE(session_id, product_id)
-- );

-- Reviews table
-- CREATE TABLE IF NOT EXISTS reviews (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
--     user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
--     rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
--     title VARCHAR(255),
--     content TEXT,
--     verified_purchase BOOLEAN DEFAULT false,
--     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- ============================================================================
-- INVENTORY & PAYMENTS
-- ============================================================================

-- Inventory logs table
-- CREATE TABLE IF NOT EXISTS inventory_logs (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
--     order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
--     type TEXT NOT NULL CHECK (type IN ('sale', 'restock', 'adjustment', 'return')),
--     quantity_change INTEGER NOT NULL,
--     previous_quantity INTEGER NOT NULL CHECK (previous_quantity >= 0),
--     new_quantity INTEGER NOT NULL CHECK (new_quantity >= 0),
--     reason TEXT,
--     created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- Payments table
-- CREATE TABLE IF NOT EXISTS payments (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
--     amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
--     currency VARCHAR(3) DEFAULT 'GHS' CHECK (currency ~ '^[A-Z]{3}$'),
--     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
--     provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal', 'paystack', 'bank_transfer', 'cash_on_delivery')),
--     provider_id TEXT,
--     gateway_response JSONB,
--     failure_reason TEXT,
--     processed_at TIMESTAMPTZ,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- Refund requests table
-- CREATE TABLE IF NOT EXISTS refund_requests (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
--     payment_reference TEXT NOT NULL,
--     amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
--     reason TEXT,
--     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
--     processed_by TEXT,
--     processed_at TIMESTAMPTZ,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- ============================================================================
-- CRM TABLES
-- ============================================================================

-- Customer profiles (extends profiles with CRM data)
-- CREATE TABLE IF NOT EXISTS customer_profiles (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
--     lifecycle_stage TEXT DEFAULT 'lead' CHECK (lifecycle_stage IN ('lead', 'active', 'inactive', 'vip', 'churned')),
--     total_spend DECIMAL(12,2) DEFAULT 0 CHECK (total_spend >= 0),
--     order_count INTEGER DEFAULT 0 CHECK (order_count >= 0),
--     last_order_date TIMESTAMPTZ,
--     last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     average_order_value DECIMAL(10,2) DEFAULT 0 CHECK (average_order_value >= 0),
--     lifetime_value DECIMAL(12,2) DEFAULT 0 CHECK (lifetime_value >= 0),
--     preferred_language TEXT DEFAULT 'en',
--     timezone TEXT DEFAULT 'UTC',
--     marketing_consent BOOLEAN DEFAULT true,
--     sms_consent BOOLEAN DEFAULT false,
--     data_retention_days INTEGER DEFAULT 2555 CHECK (data_retention_days > 0),
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     deleted_at TIMESTAMPTZ,
--     UNIQUE(user_id)
-- );

-- Customer notes
-- CREATE TABLE IF NOT EXISTS customer_notes (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
--     admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
--     note TEXT NOT NULL,
--     note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'support', 'sales', 'risk', 'complaint')),
--     is_private BOOLEAN DEFAULT true,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- Customer tags
-- CREATE TABLE IF NOT EXISTS customer_tags (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL UNIQUE,
--     color TEXT DEFAULT '#6B7280',
--     description TEXT,
--     is_system BOOLEAN DEFAULT false,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- Customer tag mapping
-- CREATE TABLE IF NOT EXISTS customer_tag_map (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
--     tag_id UUID NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
--     assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
--     assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     UNIQUE(customer_id, tag_id)
-- );

-- Customer segments
-- CREATE TABLE IF NOT EXISTS customer_segments (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL,
--     description TEXT,
--     is_active BOOLEAN DEFAULT true,
--     is_dynamic BOOLEAN DEFAULT false,
--     customer_count INTEGER DEFAULT 0 CHECK (customer_count >= 0),
--     created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- Customer segment rules
-- CREATE TABLE IF NOT EXISTS customer_segment_rules (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     segment_id UUID NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
--     field TEXT NOT NULL,
--     operator TEXT NOT NULL CHECK (operator IN ('=', '!=', '>', '>=', '<', '<=', 'in', 'not_in', 'contains', 'like')),
--     value TEXT NOT NULL,
--     condition_type TEXT DEFAULT 'and' CHECK (condition_type IN ('and', 'or')),
--     sort_order INTEGER DEFAULT 0,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- Customer segment memberships
-- CREATE TABLE IF NOT EXISTS customer_segment_memberships (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
--     segment_id UUID NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
--     added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
--     added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     UNIQUE(customer_id, segment_id)
-- );

-- Email templates
-- CREATE TABLE IF NOT EXISTS email_templates (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL UNIQUE,
--     subject TEXT NOT NULL,
--     html_content TEXT NOT NULL,
--     text_content TEXT,
--     template_type TEXT NOT NULL CHECK (template_type IN ('transactional', 'marketing', 'notification')),
--     category TEXT,
--     variables JSONB DEFAULT '[]',
--     is_active BOOLEAN DEFAULT true,
--     version INTEGER DEFAULT 1 CHECK (version > 0),
--     created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- Email logs
-- CREATE TABLE IF NOT EXISTS email_logs (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
--     customer_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
--     recipient_email TEXT NOT NULL,
--     subject TEXT NOT NULL,
--     content TEXT,
--     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
--     provider TEXT NOT NULL,
--     provider_id TEXT,
--     error_message TEXT,
--     sent_at TIMESTAMPTZ,
--     delivered_at TIMESTAMPTZ,
--     opened_at TIMESTAMPTZ,
--     clicked_at TIMESTAMPTZ,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- Email campaigns
-- CREATE TABLE IF NOT EXISTS email_campaigns (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL,
--     subject TEXT NOT NULL,
--     content TEXT NOT NULL,
--     template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
--     segment_id UUID REFERENCES customer_segments(id) ON DELETE SET NULL,
--     status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
--     scheduled_at TIMESTAMPTZ,
--     sent_at TIMESTAMPTZ,
--     total_recipients INTEGER DEFAULT 0 CHECK (total_recipients >= 0),
--     sent_count INTEGER DEFAULT 0 CHECK (sent_count >= 0),
--     delivered_count INTEGER DEFAULT 0 CHECK (delivered_count >= 0),
--     opened_count INTEGER DEFAULT 0 CHECK (opened_count >= 0),
--     clicked_count INTEGER DEFAULT 0 CHECK (clicked_count >= 0),
--     created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- Email campaign recipients
-- CREATE TABLE IF NOT EXISTS email_campaign_recipients (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
--     customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
--     email TEXT NOT NULL,
--     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
--     sent_at TIMESTAMPTZ,
--     delivered_at TIMESTAMPTZ,
--     opened_at TIMESTAMPTZ,
--     clicked_at TIMESTAMPTZ,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     UNIQUE(campaign_id, customer_id)
-- );

-- CRM automations
-- CREATE TABLE IF NOT EXISTS crm_automations (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL,
--     description TEXT,
--     is_active BOOLEAN DEFAULT true,
--     trigger_type TEXT NOT NULL CHECK (trigger_type IN ('order_placed', 'order_shipped', 'customer_inactive', 'customer_signup', 'segment_changed', 'custom')),
--     trigger_config JSONB,
--     actions JSONB NOT NULL,
--     run_count INTEGER DEFAULT 0 CHECK (run_count >= 0),
--     last_run_at TIMESTAMPTZ,
--     created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- CRM automation logs
-- CREATE TABLE IF NOT EXISTS crm_automation_logs (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     automation_id UUID NOT NULL REFERENCES crm_automations(id) ON DELETE CASCADE,
--     customer_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
--     trigger_data JSONB,
--     actions_executed JSONB,
--     status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
--     error_message TEXT,
--     execution_time_ms INTEGER,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================

-- CREATE TABLE IF NOT EXISTS admin_audit_log (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--     action TEXT NOT NULL,
--     table_name TEXT,
--     record_id UUID,
--     old_values JSONB,
--     new_values JSONB,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- ============================================================================
-- INDEXES
-- ============================================================================
 
-- User management indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- Category indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at);

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_videos ON products USING GIN(videos);

-- Full-text search index for products
-- CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(short_description, '')));

-- Order indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at);

-- Order item indexes
-- CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
-- CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Cart indexes
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_session ON cart(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_product ON cart(user_id, product_id);

-- Review indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- Inventory log indexes
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_order ON inventory_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_by ON inventory_logs(created_by);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);

-- Refund request indexes
CREATE INDEX IF NOT EXISTS idx_refund_requests_order_id ON refund_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_payment_reference ON refund_requests(payment_reference);

-- Customer profile indexes
-- CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
-- CREATE INDEX IF NOT EXISTS idx_customer_profiles_lifecycle_stage ON customer_profiles(lifecycle_stage);
-- CREATE INDEX IF NOT EXISTS idx_customer_profiles_total_spend ON customer_profiles(total_spend);
-- CREATE INDEX IF NOT EXISTS idx_customer_profiles_last_order_date ON customer_profiles(last_order_date);
-- CREATE INDEX IF NOT EXISTS idx_customer_profiles_last_activity ON customer_profiles(last_activity);
-- CREATE INDEX IF NOT EXISTS idx_customer_profiles_deleted_at ON customer_profiles(deleted_at);

-- Customer note indexes
-- CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);
-- CREATE INDEX IF NOT EXISTS idx_customer_notes_admin_id ON customer_notes(admin_id);
-- CREATE INDEX IF NOT EXISTS idx_customer_notes_created_at ON customer_notes(created_at);
         
-- Customer tag indexes
-- CREATE INDEX IF NOT EXISTS idx_customer_tags_name ON customer_tags(name);
-- CREATE INDEX IF NOT EXISTS idx_customer_tags_is_system ON customer_tags(is_system);
  
-- Customer tag map indexes
-- CREATE INDEX IF NOT EXISTS idx_customer_tag_map_customer_id ON customer_tag_map(customer_id);
-- CREATE INDEX IF NOT EXISTS idx_customer_tag_map_tag_id ON customer_tag_map(tag_id);

-- Customer segment indexes
-- CREATE INDEX IF NOT EXISTS idx_customer_segments_is_active ON customer_segments(is_active);
-- CREATE INDEX IF NOT EXISTS idx_customer_segments_is_dynamic ON customer_segments(is_dynamic);
-- CREATE INDEX IF NOT EXISTS idx_customer_segments_created_by ON customer_segments(created_by);
 
-- Customer segment rule indexes
-- CREATE INDEX IF NOT EXISTS idx_customer_segment_rules_segment_id ON customer_segment_rules(segment_id);
-- CREATE INDEX IF NOT EXISTS idx_customer_segment_rules_field ON customer_segment_rules(field);

-- Customer segment membership indexes
-- CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_customer_id ON customer_segment_memberships(customer_id);
-- CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_segment_id ON customer_segment_memberships(segment_id);

-- Email template indexes
-- CREATE INDEX IF NOT EXISTS idx_email_templates_template_type ON email_templates(template_type);
-- CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
-- CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);

-- Email log indexes
-- CREATE INDEX IF NOT EXISTS idx_email_logs_customer_id ON email_logs(customer_id);
-- CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
-- CREATE INDEX IF NOT EXISTS idx_email_logs_provider ON email_logs(provider);
-- CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- CRM automation indexes
-- CREATE INDEX IF NOT EXISTS idx_crm_automations_is_active ON crm_automations(is_active);
-- CREATE INDEX IF NOT EXISTS idx_crm_automations_trigger_type ON crm_automations(trigger_type);
-- CREATE INDEX IF NOT EXISTS idx_crm_automations_created_by ON crm_automations(created_by);

-- CRM automation log indexes
-- CREATE INDEX IF NOT EXISTS idx_crm_automation_logs_automation_id ON crm_automation_logs(automation_id);
-- CREATE INDEX IF NOT EXISTS idx_crm_automation_logs_customer_id ON crm_automation_logs(customer_id);
-- CREATE INDEX IF NOT EXISTS idx_crm_automation_logs_created_at ON crm_automation_logs(created_at);

-- Email campaign indexes
-- CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
-- CREATE INDEX IF NOT EXISTS idx_email_campaigns_segment_id ON email_campaigns(segment_id);
-- CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON email_campaigns(created_by);
-- CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at);

-- Email campaign recipient indexes
-- CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_campaign_id ON email_campaign_recipients(campaign_id);
-- CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_customer_id ON email_campaign_recipients(customer_id);
-- CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_status ON email_campaign_recipients(status);

-- Audit log indexes
-- CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id ON admin_audit_log(admin_user_id);
-- CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Updated at trigger function
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
-- DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
-- CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
-- CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
-- CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DROP TRIGGER IF EXISTS update_products_updated_at ON products;
-- CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
-- CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_updated_at ON cart;
CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON cart FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_refund_requests_updated_at ON refund_requests;
CREATE TRIGGER update_refund_requests_updated_at BEFORE UPDATE ON refund_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DROP TRIGGER IF EXISTS update_customer_profiles_updated_at ON customer_profiles;
-- CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DROP TRIGGER IF EXISTS update_customer_notes_updated_at ON customer_notes;
-- CREATE TRIGGER update_customer_notes_updated_at BEFORE UPDATE ON customer_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DROP TRIGGER IF EXISTS update_customer_tags_updated_at ON customer_tags;
-- CREATE TRIGGER update_customer_tags_updated_at BEFORE UPDATE ON customer_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DROP TRIGGER IF EXISTS update_customer_segments_updated_at ON customer_segments;
-- CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
-- CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DROP TRIGGER IF EXISTS update_email_logs_updated_at ON email_logs;
-- CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON email_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns;
-- CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DROP TRIGGER IF EXISTS update_crm_automations_updated_at ON crm_automations;
-- CREATE TRIGGER update_crm_automations_updated_at BEFORE UPDATE ON crm_automations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sync user profile from auth.users
-- CREATE OR REPLACE FUNCTION sync_user_profile()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     INSERT INTO profiles (user_id, first_name, last_name, role, email_verified)
--     VALUES (
--         NEW.id,
--         COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', ''),
--         COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
--         COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
--         NEW.email_confirmed_at IS NOT NULL
--     )
--     ON CONFLICT (user_id) 
--     DO UPDATE SET
--         email_verified = NEW.email_confirmed_at IS NOT NULL,
--         updated_at = NOW();
    
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION sync_user_profile();

-- Admin check function
-- CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
-- RETURNS BOOLEAN AS $$
-- BEGIN
--     RETURN EXISTS (
--         SELECT 1 FROM admin_users 
--         WHERE admin_users.user_id = is_admin.user_id
--     );
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
-- GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Users with profile view
CREATE OR REPLACE VIEW users_with_profile AS
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at as auth_created_at,
    u.last_sign_in_at,
    p.id as profile_id,
    p.first_name,
    p.last_name,
    p.phone,
    p.role,
    p.email_verified,
    p.avatar_url,
    p.created_at as profile_created_at,
    p.updated_at as profile_updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id;

-- Customer analytics view
CREATE OR REPLACE VIEW customer_analytics AS
SELECT 
    cp.id as customer_profile_id,
    p.id as profile_id,
    u.id as user_id,
    u.email,
    p.first_name,
    p.last_name,
    p.phone,
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
    END as orders_per_month
FROM customer_profiles cp
JOIN profiles p ON cp.user_id = p.id
JOIN auth.users u ON p.user_id = u.id
WHERE cp.deleted_at IS NULL;

-- Payment analytics view
CREATE OR REPLACE VIEW payment_analytics AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    payment_provider,
    currency,
    COUNT(*) as total_orders,
    SUM(total) as total_amount,
    SUM(CASE WHEN payment_status = 'completed' THEN total ELSE 0 END) as successful_amount,
    SUM(CASE WHEN payment_status = 'failed' THEN total ELSE 0 END) as failed_amount,
    AVG(total) as average_order_value
FROM orders 
WHERE created_at >= NOW() - INTERVAL '1 year'
    AND deleted_at IS NULL
GROUP BY DATE_TRUNC('month', created_at), payment_provider, currency
ORDER BY month DESC;

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- INSERT INTO categories (name, slug, description, sort_order) VALUES 
-- ('Clothing', 'clothing', 'Afrocentric clothing and apparel', 1),
-- ('Accessories', 'accessories', 'Fashion accessories and jewelry', 2),
-- ('Home & Living', 'home-living', 'Home decor and lifestyle products', 3),
-- ('Art & Crafts', 'art-crafts', 'Traditional and contemporary art pieces', 4)
-- ON CONFLICT (slug) DO NOTHING;

-- INSERT INTO customer_tags (name, color, description, is_system) VALUES 
-- ('VIP', '#FFD700', 'High-value customer with special privileges', true),
-- ('Wholesale', '#8B4513', 'Business customer with wholesale pricing', true),
-- ('Abandoned Cart', '#FF6B6B', 'Customer with abandoned cart items', true),
-- ('High Risk', '#DC143C', 'Customer with payment or fraud issues', true),
-- ('New Customer', '#32CD32', 'Recently registered customer', true),
-- ('Repeat Customer', '#4169E1', 'Customer with multiple purchases', true),
-- ('Inactive', '#808080', 'Customer with no recent activity', true),
-- ('Premium', '#9370DB', 'Premium tier customer', true)
-- ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- MIGRATION LOG ENTRY
-- ============================================================================

-- INSERT INTO migration_log (migration_name, executed_at, success, checksum)
-- VALUES ('002_create_canonical_schema.sql', NOW(), true, md5(current_timestamp::text))
-- ON CONFLICT (migration_name) DO UPDATE SET
--     executed_at = NOW(),
--     success = true;

-- COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
--
-- This migration creates the canonical PostgreSQL/Supabase schema.
--
-- KEY FEATURES:
-- 1. All MySQL-specific syntax removed
-- 2. Standardized on PostgreSQL 17 + Supabase
-- 3. auth.users + profiles pattern established
-- 4. Consistent naming conventions (snake_case)
-- 5. Proper foreign keys with consistent ON DELETE behavior
-- 6. Comprehensive indexing for performance
-- 7. CHECK constraints for data validation
-- 8. Soft delete pattern with deleted_at columns
-- 9. Migration tracking table created
-- 10. Security functions and triggers in place
--
-- NEXT STEPS:
-- 1. Run data migration scripts to migrate existing data
-- 2. Apply RLS policies (next migration)
-- 3. Test all functionality
-- 4. Validate data integrity
