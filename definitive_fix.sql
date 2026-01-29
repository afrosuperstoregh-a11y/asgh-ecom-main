-- Definitive fix for customer_profiles table creation
-- This will completely recreate the table structure

-- Step 1: Drop everything that depends on customer_profiles
DROP TABLE IF EXISTS customer_tag_map CASCADE;
DROP TABLE IF EXISTS customer_notes CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS crm_automation_logs CASCADE;
DROP TABLE IF EXISTS customer_profiles CASCADE;

-- Step 2: Create customer_profiles with the simplest possible structure first
CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL
);

-- Step 3: Verify the table was created with the id column
SELECT 'Step 3: customer_profiles created with id column' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'customer_profiles' ORDER BY ordinal_position;

-- Step 4: Add all other columns one by one
ALTER TABLE customer_profiles ADD COLUMN full_name TEXT;
ALTER TABLE customer_profiles ADD COLUMN lifecycle_stage TEXT DEFAULT 'lead';
ALTER TABLE customer_profiles ADD COLUMN total_spend DECIMAL(12,2) DEFAULT 0;
ALTER TABLE customer_profiles ADD COLUMN order_count INTEGER DEFAULT 0;
ALTER TABLE customer_profiles ADD COLUMN last_order_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE customer_profiles ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE customer_profiles ADD COLUMN average_order_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE customer_profiles ADD COLUMN lifetime_value DECIMAL(12,2) DEFAULT 0;
ALTER TABLE customer_profiles ADD COLUMN preferred_language TEXT DEFAULT 'en';
ALTER TABLE customer_profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';
ALTER TABLE customer_profiles ADD COLUMN marketing_consent BOOLEAN DEFAULT true;
ALTER TABLE customer_profiles ADD COLUMN sms_consent BOOLEAN DEFAULT false;
ALTER TABLE customer_profiles ADD COLUMN data_retention_days INTEGER DEFAULT 2555;
ALTER TABLE customer_profiles ADD COLUMN soft_deleted BOOLEAN DEFAULT false;
ALTER TABLE customer_profiles ADD COLUMN soft_deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE customer_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE customer_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 5: Add constraints
ALTER TABLE customer_profiles ADD CONSTRAINT unique_user_id UNIQUE (user_id);
ALTER TABLE customer_profiles ADD CONSTRAINT check_lifecycle_stage 
    CHECK (lifecycle_stage IN ('lead', 'active', 'inactive', 'vip', 'churned'));

-- Step 6: Add foreign key
ALTER TABLE customer_profiles ADD CONSTRAINT fk_customer_profiles_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 7: Final verification
SELECT 'Step 7: customer_profiles table completed successfully' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'customer_profiles' ORDER BY ordinal_position;
