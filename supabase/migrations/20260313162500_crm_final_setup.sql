-- Final CRM Setup Migration
-- This migration adds the remaining CRM tables without problematic foreign keys

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
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

-- Create CRM automations table
CREATE TABLE IF NOT EXISTS crm_automations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create CRM automation logs table
CREATE TABLE IF NOT EXISTS crm_automation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_id UUID NOT NULL REFERENCES crm_automations(id) ON DELETE CASCADE,
    trigger_data JSONB,
    actions_executed JSONB,
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
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

-- Create email campaign recipients table
CREATE TABLE IF NOT EXISTS email_campaign_recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, email)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_templates_template_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_provider ON email_logs(provider);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_crm_automations_is_active ON crm_automations(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_automations_trigger_type ON crm_automations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_crm_automations_created_by ON crm_automations(created_by);

CREATE INDEX IF NOT EXISTS idx_crm_automation_logs_automation_id ON crm_automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_crm_automation_logs_created_at ON crm_automation_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON email_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_campaign_id ON email_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_status ON email_campaign_recipients(status);

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
