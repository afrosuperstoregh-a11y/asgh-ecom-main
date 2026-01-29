-- Complete fix for customer_profiles schema
-- This script will completely recreate the customer_profiles table correctly

-- Step 1: Drop all dependent tables first
DROP TABLE IF EXISTS customer_tag_map CASCADE;
DROP TABLE IF EXISTS customer_notes CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS crm_automation_logs CASCADE;

-- Step 2: Drop the main table
DROP TABLE IF EXISTS customer_profiles CASCADE;

-- Step 3: Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 4: Create customer_profiles table with explicit structure
CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL,
    full_name TEXT,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Add unique constraint
ALTER TABLE customer_profiles ADD CONSTRAINT unique_user_id UNIQUE (user_id);

-- Step 6: Add foreign key constraint
ALTER TABLE customer_profiles ADD CONSTRAINT fk_customer_profiles_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 7: Verify table was created correctly
SELECT 'customer_profiles table created successfully' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'customer_profiles' ORDER BY ordinal_position;
