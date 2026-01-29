-- Migration 006: Create customer_profiles table
-- This table stores customer lifecycle and analytics data
-- Compatible with existing integer-based user IDs

-- First, check if we need to handle UUID vs INT mismatch
-- This version works with existing integer user IDs

CREATE TABLE IF NOT EXISTS customer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lifecycle_stage VARCHAR(20) DEFAULT 'lead' CHECK (lifecycle_stage IN ('lead', 'active', 'inactive', 'vip', 'churned')),
    total_spend DECIMAL(12,2) DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    last_order_date TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    lifetime_value DECIMAL(12,2) DEFAULT 0,
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    marketing_consent BOOLEAN DEFAULT TRUE,
    sms_consent BOOLEAN DEFAULT FALSE,
    data_retention_days INTEGER DEFAULT 2555,
    soft_deleted BOOLEAN DEFAULT FALSE,
    soft_deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_lifecycle_stage ON customer_profiles(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_last_activity ON customer_profiles(last_activity);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_total_spend ON customer_profiles(total_spend);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_order_count ON customer_profiles(order_count);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_soft_deleted ON customer_profiles(soft_deleted);

-- Create trigger for updated_at (PostgreSQL)
CREATE OR REPLACE FUNCTION update_customer_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles 
FOR EACH ROW EXECUTE FUNCTION update_customer_profiles_updated_at();
