# Supabase SQL Setup Instructions

## 🎯 Quick Setup Guide

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/azpgqsmgyorjbqsgxuxw/sql
2. Click "New query"

### Step 2: Run CRM Schema (Copy & Paste)
```sql
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
    data_retention_days INTEGER DEFAULT 2555,
    soft_deleted BOOLEAN DEFAULT false,
    soft_deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Customer Notes
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_lifecycle_stage ON customer_profiles(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_total_spend ON customer_profiles(total_spend);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_last_order_date ON customer_profiles(last_order_date);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_soft_deleted ON customer_profiles(soft_deleted);

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_admin_id ON customer_notes(admin_id);

CREATE INDEX IF NOT EXISTS idx_customer_tags_name ON customer_tags(name);
CREATE INDEX IF NOT EXISTS idx_customer_tags_is_system ON customer_tags(is_system);

CREATE INDEX IF NOT EXISTS idx_customer_tag_map_customer_id ON customer_tag_map(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_tag_map_tag_id ON customer_tag_map(tag_id);

CREATE INDEX IF NOT EXISTS idx_customer_segments_is_active ON customer_segments(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_segments_is_dynamic ON customer_segments(is_dynamic);

CREATE INDEX IF NOT EXISTS idx_email_templates_template_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_email_logs_customer_id ON email_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_provider ON email_logs(provider);

CREATE INDEX IF NOT EXISTS idx_crm_automations_is_active ON crm_automations(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_automations_trigger_type ON crm_automations(trigger_type);

CREATE INDEX IF NOT EXISTS idx_crm_automation_logs_automation_id ON crm_automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_crm_automation_logs_customer_id ON crm_automation_logs(customer_id);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_segment_id ON email_campaigns(segment_id);

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
('All Customers', 'All registered customers', true, 1),
('VIP Customers', 'Customers with high lifetime value', true, 1),
('New Customers', 'Customers registered in the last 30 days', true, 1),
('Active Customers', 'Customers with purchase in last 90 days', true, 1),
('Inactive Customers', 'Customers with no purchase in last 180 days', true, 1),
('High Spenders', 'Customers with total spend > $1000', true, 1)
ON CONFLICT DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content, template_type, category, variables, created_by) VALUES 
('Order Confirmation', 'Your Afro Superstore Order #{{order_number}} is Confirmed', 
'<h1>Thank you for your order!</h1><p>Order #{{order_number}}</p><p>Total: {{order_total}}</p>',
'Thank you for your order! Order #{{order_number}} Total: {{order_total}}',
'transactional', 'order_confirmation', 
'["order_number", "order_total", "customer_name", "shipping_address"]',
1),

('Shipping Confirmation', 'Your Afro Superstore Order #{{order_number}} has Shipped!',
'<h1>Your order has shipped!</h1><p>Order #{{order_number}}</p><p>Tracking: {{tracking_number}}</p>',
'Your order has shipped! Order #{{order_number}} Tracking: {{tracking_number}}',
'transactional', 'shipping_update',
'["order_number", "tracking_number", "customer_name"]',
1),

('Welcome Email', 'Welcome to Afro Superstore!',
'<h1>Welcome to Afro Superstore!</h1><p>Hi {{customer_name}}, thank you for joining us!</p>',
'Welcome to Afro Superstore! Hi {{customer_name}}, thank you for joining us!',
'marketing', 'welcome',
'["customer_name", "customer_email"]',
1)
ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger function
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
```

### Step 3: Run Security Policies (New Query)
```sql
-- Enable RLS on all CRM tables
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tag_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_automation_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all CRM data
CREATE POLICY "Admins can view all customer profiles" ON customer_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage customer profiles" ON customer_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Similar policies for other tables...
CREATE POLICY "Admins can view all customer notes" ON customer_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage customer notes" ON customer_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON customer_profiles TO authenticated;
GRANT SELECT ON customer_tags TO authenticated;
GRANT SELECT ON customer_segments TO authenticated;
GRANT SELECT ON email_templates TO authenticated;
```

### Step 4: Verify Setup
```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'customer_%' OR table_name LIKE 'email_%' OR table_name LIKE 'crm_%';

-- Check sample data
SELECT COUNT(*) as customer_profiles FROM customer_profiles;
SELECT COUNT(*) as customer_tags FROM customer_tags;
SELECT COUNT(*) as customer_segments FROM customer_segments;
SELECT COUNT(*) as email_templates FROM email_templates;
```

---

## ✅ **After Running SQL**

1. **Test CRM API**: Routes should return 401 (authentication required)
2. **Login to Admin**: Use `admin@afrosuperstore.ca` / `Admin123!`
3. **Access CRM**: Navigate to CRM section in admin panel
4. **Test Features**: Create customers, segments, email templates

🎉 **Your CRM system will be fully functional!**
