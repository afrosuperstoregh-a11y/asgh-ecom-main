-- Migration 006: Create customer_profiles table
-- This table stores customer lifecycle and analytics data
-- PostgreSQL version with UUID support

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_lifecycle_stage ON customer_profiles(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_last_activity ON customer_profiles(last_activity);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_total_spend ON customer_profiles(total_spend);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_order_count ON customer_profiles(order_count);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_soft_deleted ON customer_profiles(soft_deleted);

-- Create trigger for updated_at
CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
