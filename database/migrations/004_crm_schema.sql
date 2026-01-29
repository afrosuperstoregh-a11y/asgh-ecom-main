-- CRM Schema Migration for Afro Superstore
-- Migration 004: Complete CRM functionality with customer management, segmentation, and automation

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    data_retention_days INTEGER DEFAULT 2555, -- 7 years default
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
    is_system BOOLEAN DEFAULT false, -- System tags cannot be deleted
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
    is_dynamic BOOLEAN DEFAULT false, -- Dynamic segments update automatically
    customer_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Segment Rules (for dynamic segments)
CREATE TABLE IF NOT EXISTS customer_segment_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    segment_id UUID NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
    field TEXT NOT NULL, -- Field name: total_spend, order_count, last_order_date, etc.
    operator TEXT NOT NULL CHECK (operator IN ('=', '!=', '>', '>=', '<', '<=', 'in', 'not_in', 'contains', 'like')),
    value TEXT NOT NULL, -- JSON value for complex conditions
    condition_type TEXT DEFAULT 'and' CHECK (condition_type IN ('and', 'or')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Segment Membership
CREATE TABLE IF NOT EXISTS customer_segment_memberships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    segment_id UUID NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for dynamic segments
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, segment_id)
);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    template_type TEXT NOT NULL CHECK (template_type IN ('transactional', 'marketing', 'notification')),
    category TEXT, -- order_confirmation, shipping_update, welcome, etc.
    variables JSONB DEFAULT '[]', -- Array of variable names used in template
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
    provider TEXT NOT NULL, -- resend, sendgrid, etc.
    provider_id TEXT, -- External provider message ID
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Automations
CREATE TABLE IF NOT EXISTS crm_automations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('order_placed', 'order_shipped', 'customer_inactive', 'customer_signup', 'segment_changed', 'custom')),
    trigger_config JSONB, -- Configuration for trigger
    actions JSONB NOT NULL, -- Array of actions to perform
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

-- Campaigns (for email marketing)
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    segment_id UUID REFERENCES customer_segments(id) ON DELETE SET NULL, -- Target segment
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

-- Create indexes for performance
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

CREATE INDEX IF NOT EXISTS idx_email_templates_template_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_email_logs_customer_id ON email_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_provider ON email_logs(provider);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_crm_automations_is_active ON crm_automations(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_automations_trigger_type ON crm_automations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_crm_automations_created_by ON crm_automations(created_by);

CREATE INDEX IF NOT EXISTS idx_crm_automation_logs_automation_id ON crm_automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_crm_automation_logs_customer_id ON crm_automation_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_automation_logs_created_at ON crm_automation_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_segment_id ON email_campaigns(segment_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON email_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_campaign_id ON email_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_customer_id ON email_campaign_recipients(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_status ON email_campaign_recipients(status);

-- Insert default customer tags
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

-- Insert default customer segments
INSERT INTO customer_segments (name, description, is_dynamic, created_by) VALUES 
('All Customers', 'All registered customers', true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
('VIP Customers', 'Customers with high lifetime value', true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
('New Customers', 'Customers registered in the last 30 days', true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
('Active Customers', 'Customers with purchase in last 90 days', true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
('Inactive Customers', 'Customers with no purchase in last 180 days', true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
('High Spenders', 'Customers with total spend > $1000', true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Insert default segment rules for dynamic segments
-- VIP Customers: total_spend > 1000
INSERT INTO customer_segment_rules (segment_id, field, operator, value, condition_type, sort_order)
SELECT 
    cs.id, 'total_spend', '>', '1000', 'and', 0
FROM customer_segments cs 
WHERE cs.name = 'VIP Customers'
LIMIT 1;

-- New Customers: created_at >= NOW() - INTERVAL '30 days'
INSERT INTO customer_segment_rules (segment_id, field, operator, value, condition_type, sort_order)
SELECT 
    cs.id, 'created_at', '>=', 'NOW() - INTERVAL ''30 days''', 'and', 0
FROM customer_segments cs 
WHERE cs.name = 'New Customers'
LIMIT 1;

-- Active Customers: last_order_date >= NOW() - INTERVAL '90 days'
INSERT INTO customer_segment_rules (segment_id, field, operator, value, condition_type, sort_order)
SELECT 
    cs.id, 'last_order_date', '>=', 'NOW() - INTERVAL ''90 days''', 'and', 0
FROM customer_segments cs 
WHERE cs.name = 'Active Customers'
LIMIT 1;

-- Inactive Customers: last_order_date < NOW() - INTERVAL '180 days' OR last_order_date IS NULL
INSERT INTO customer_segment_rules (segment_id, field, operator, value, condition_type, sort_order)
SELECT 
    cs.id, 'last_order_date', '<', 'NOW() - INTERVAL ''180 days''', 'or', 0
FROM customer_segments cs 
WHERE cs.name = 'Inactive Customers'
LIMIT 1;

INSERT INTO customer_segment_rules (segment_id, field, operator, value, condition_type, sort_order)
SELECT 
    cs.id, 'last_order_date', 'IS NULL', '', 'or', 1
FROM customer_segments cs 
WHERE cs.name = 'Inactive Customers'
LIMIT 1;

-- High Spenders: total_spend > 1000
INSERT INTO customer_segment_rules (segment_id, field, operator, value, condition_type, sort_order)
SELECT 
    cs.id, 'total_spend', '>', '1000', 'and', 0
FROM customer_segments cs 
WHERE cs.name = 'High Spenders'
LIMIT 1;

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content, template_type, category, variables, created_by) VALUES 
('Order Confirmation', 'Your Afro Superstore Order #{{order_number}} is Confirmed', 
'<h1>Thank you for your order!</h1><p>Order #{{order_number}}</p><p>Total: {{order_total}}</p>',
'Thank you for your order! Order #{{order_number}} Total: {{order_total}}',
'transactional', 'order_confirmation', 
'["order_number", "order_total", "customer_name", "shipping_address"]',
(SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),

('Shipping Confirmation', 'Your Afro Superstore Order #{{order_number}} has Shipped!',
'<h1>Your order has shipped!</h1><p>Order #{{order_number}}</p><p>Tracking: {{tracking_number}}</p>',
'Your order has shipped! Order #{{order_number}} Tracking: {{tracking_number}}',
'transactional', 'shipping_update',
'["order_number", "tracking_number", "customer_name"]',
(SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),

('Welcome Email', 'Welcome to Afro Superstore!',
'<h1>Welcome to Afro Superstore!</h1><p>Hi {{customer_name}}, thank you for joining us!</p>',
'Welcome to Afro Superstore! Hi {{customer_name}}, thank you for joining us!',
'marketing', 'welcome',
'["customer_name", "customer_email"]',
(SELECT id FROM users WHERE role = 'super_admin' LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_notes_updated_at BEFORE UPDATE ON customer_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_tags_updated_at BEFORE UPDATE ON customer_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON email_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_automations_updated_at BEFORE UPDATE ON crm_automations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update customer profile metrics
CREATE OR REPLACE FUNCTION update_customer_metrics(customer_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE customer_profiles 
    SET 
        total_spend = COALESCE((
            SELECT COALESCE(SUM(o.total_amount), 0)
            FROM orders o 
            WHERE o.customer_id = customer_uuid 
            AND o.payment_status = 'paid'
        ), 0),
        order_count = COALESCE((
            SELECT COUNT(*)
            FROM orders o 
            WHERE o.customer_id = customer_uuid 
            AND o.payment_status = 'paid'
        ), 0),
        last_order_date = (
            SELECT MAX(o.created_at)
            FROM orders o 
            WHERE o.customer_id = customer_uuid 
            AND o.payment_status = 'paid'
        ),
        average_order_value = CASE 
            WHEN (
                SELECT COUNT(*) 
                FROM orders o 
                WHERE o.customer_id = customer_uuid 
                AND o.payment_status = 'paid'
            ) > 0 
            THEN (
                SELECT COALESCE(AVG(o.total_amount), 0)
                FROM orders o 
                WHERE o.customer_id = customer_uuid 
                AND o.payment_status = 'paid'
            )
            ELSE 0 
        END,
        lifetime_value = COALESCE((
            SELECT COALESCE(SUM(o.total_amount), 0)
            FROM orders o 
            WHERE o.customer_id = customer_uuid 
            AND o.payment_status = 'paid'
        ), 0),
        last_activity = GREATEST(
            COALESCE((
                SELECT MAX(o.created_at)
                FROM orders o 
                WHERE o.customer_id = customer_uuid
            ), '1970-01-01'::timestamp),
            COALESCE((
                SELECT MAX(cp.updated_at)
                FROM customer_profiles cp 
                WHERE cp.id = customer_uuid
            ), '1970-01-01'::timestamp)
        )
    WHERE id = customer_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update customer metrics when order is placed
CREATE OR REPLACE FUNCTION update_customer_on_order()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_customer_metrics(NEW.customer_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_on_order 
    AFTER INSERT OR UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_customer_on_order();

-- Create function to update dynamic segments
CREATE OR REPLACE FUNCTION update_dynamic_segments()
RETURNS VOID AS $$
DECLARE
    segment_record RECORD;
    customer_record RECORD;
    rule_record RECORD;
    meets_conditions BOOLEAN;
BEGIN
    -- Loop through all dynamic segments
    FOR segment_record IN 
        SELECT id FROM customer_segments WHERE is_dynamic = true AND is_active = true
    LOOP
        -- Clear existing memberships for this segment
        DELETE FROM customer_segment_memberships WHERE segment_id = segment_record.id;
        
        -- Loop through all customers
        FOR customer_record IN 
            SELECT cp.id, cp.user_id, cp.total_spend, cp.order_count, cp.last_order_date, cp.created_at, cp.lifecycle_stage
            FROM customer_profiles cp 
            WHERE cp.soft_deleted = false
        LOOP
            meets_conditions := true;
            
            -- Check each rule for this segment
            FOR rule_record IN 
                SELECT field, operator, value, condition_type 
                FROM customer_segment_rules 
                WHERE segment_id = segment_record.id 
                ORDER BY sort_order
            LOOP
                -- Evaluate rule condition
                IF rule_record.condition_type = 'and' AND meets_conditions = false THEN
                    CONTINUE;
                END IF;
                
                -- Simple rule evaluation (can be extended for complex conditions)
                CASE rule_record.field
                    WHEN 'total_spend' THEN
                        IF rule_record.operator = '>' AND NOT (customer_record.total_spend > CAST(rule_record.value AS DECIMAL)) THEN
                            meets_conditions := false;
                        ELSIF rule_record.operator = '<' AND NOT (customer_record.total_spend < CAST(rule_record.value AS DECIMAL)) THEN
                            meets_conditions := false;
                        ELSIF rule_record.operator = '=' AND NOT (customer_record.total_spend = CAST(rule_record.value AS DECIMAL)) THEN
                            meets_conditions := false;
                        END IF;
                    WHEN 'order_count' THEN
                        IF rule_record.operator = '>' AND NOT (customer_record.order_count > CAST(rule_record.value AS INTEGER)) THEN
                            meets_conditions := false;
                        ELSIF rule_record.operator = '<' AND NOT (customer_record.order_count < CAST(rule_record.value AS INTEGER)) THEN
                            meets_conditions := false;
                        ELSIF rule_record.operator = '=' AND NOT (customer_record.order_count = CAST(rule_record.value AS INTEGER)) THEN
                            meets_conditions := false;
                        END IF;
                    WHEN 'last_order_date' THEN
                        IF rule_record.operator = '>=' AND NOT (customer_record.last_order_date >= (NOW() - CAST(rule_record.value AS INTERVAL))) THEN
                            meets_conditions := false;
                        ELSIF rule_record.operator = '<' AND NOT (customer_record.last_order_date < (NOW() - CAST(rule_record.value AS INTERVAL))) THEN
                            meets_conditions := false;
                        ELSIF rule_record.operator = 'IS NULL' AND customer_record.last_order_date IS NOT NULL THEN
                            meets_conditions := false;
                        END IF;
                    WHEN 'created_at' THEN
                        IF rule_record.operator = '>=' AND NOT (customer_record.created_at >= (NOW() - CAST(rule_record.value AS INTERVAL))) THEN
                            meets_conditions := false;
                        END IF;
                END CASE;
            END LOOP;
            
            -- Add customer to segment if conditions are met
            IF meets_conditions THEN
                INSERT INTO customer_segment_memberships (customer_id, segment_id, added_at)
                VALUES (customer_record.id, segment_record.id, NOW())
                ON CONFLICT (customer_id, segment_id) DO NOTHING;
            END IF;
        END LOOP;
        
        -- Update customer count for segment
        UPDATE customer_segments 
        SET customer_count = (
            SELECT COUNT(*) 
            FROM customer_segment_memberships 
            WHERE segment_id = segment_record.id
        )
        WHERE id = segment_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create initial customer profiles for existing users
INSERT INTO customer_profiles (user_id, lifecycle_stage, total_spend, order_count, last_activity)
SELECT 
    u.id,
    CASE 
        WHEN u.created_at > NOW() - INTERVAL '30 days' THEN 'lead'
        WHEN EXISTS(SELECT 1 FROM orders o WHERE o.customer_id = u.id AND o.created_at > NOW() - INTERVAL '90 days') THEN 'active'
        WHEN EXISTS(SELECT 1 FROM orders o WHERE o.customer_id = u.id AND o.created_at < NOW() - INTERVAL '180 days') THEN 'inactive'
        ELSE 'lead'
    END,
    COALESCE(SUM.total_spend, 0),
    COALESCE(SUM.order_count, 0),
    GREATEST(u.created_at, COALESCE(SUM.last_order, u.created_at))
FROM users u
LEFT JOIN (
    SELECT 
        o.customer_id,
        COALESCE(SUM(o.total_amount), 0) as total_spend,
        COUNT(*) as order_count,
        MAX(o.created_at) as last_order
    FROM orders o 
    WHERE o.payment_status = 'paid'
    GROUP BY o.customer_id
) SUM ON u.id = SUM.customer_id
WHERE u.role = 'customer'
ON CONFLICT (user_id) DO UPDATE SET
    total_spend = EXCLUDED.total_spend,
    order_count = EXCLUDED.order_count,
    last_activity = EXCLUDED.last_activity;

-- Create view for customer analytics
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
    -- Calculate recency score (days since last order)
    CASE 
        WHEN cp.last_order_date IS NULL THEN 999
        ELSE EXTRACT(DAYS FROM NOW() - cp.last_order_date)::INTEGER
    END as days_since_last_order,
    -- Calculate frequency score (orders per month)
    CASE 
        WHEN cp.created_at IS NULL THEN 0
        ELSE ROUND((cp.order_count::DECIMAL / GREATEST(EXTRACT(DAYS FROM NOW() - cp.created_at)::INTEGER, 1)) * 30, 2)
    END as orders_per_month,
    -- Segment memberships
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
    -- Tags
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

COMMIT;
